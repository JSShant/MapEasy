"use strict";
//Global Variables
const form = document.querySelector(".form");
const containerWorkouts = document.querySelector(".workouts");
const inputType = document.querySelector(".form__input--type");
const inputDistance = document.querySelector(".form__input--distance");
const inputDuration = document.querySelector(".form__input--duration");
const inputSpeed = document.querySelector(".form__input--speed");
const inputElevation = document.querySelector(".form__input--elevation");

class Workout {
  date = new Date();
  id = (Date.now() + "").slice(-10);
  constructor(coords, distance, duration) {
    this.coords = coords;
    this.distance = distance;
    this.duration = duration;
  }

  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()]
    } ${this.date.getDate()}`;
  }
}

class Running extends Workout {
  type = "running";

  constructor(coords, distance, duration, speed) {
    super(coords, distance, duration);
    this.speed = speed;
    this.calcPace();
    this._setDescription();
  }

  calcPace() {
    this.pace = this.duration / this.distance;
    return this.pace;
  }
}

class Cycling extends Workout {
  type = "cycling";

  constructor(coords, distance, duration, elev) {
    super(coords, distance, duration);
    this.elev = elev;
    this.calcSpeed();
    this._setDescription();
  }

  calcSpeed() {
    this.speed = this.distance / (this.duration / 60);
    return this.speed;
  }
}

/////////////////////////////////////////////////////////////////
//APPLICATION STRUCTURE
class App {
  #map; //Private properties - class field
  #mapEvent;
  #workouts = [];
  #mapZoomLevel = 13;

  constructor() {
    //User positions
    this._getPosition();
    //Getting Data from storage
    this._getLocalStorage();
    //Event Handlers
    form.addEventListener("submit", this._newWorkout.bind(this));
    inputType.addEventListener("change", this._toggledElevationField);
    containerWorkouts.addEventListener("click", this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert("Could not get your position");
        }
      );
  }

  _loadMap(position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    const coords = [latitude, longitude];
    this.#map = L.map("map").setView(coords, this.#mapZoomLevel);
    L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    //Handling the clicks on the map
    this.#map.on("click", this._showForm.bind(this));
    //Rendering Marker
    this.#workouts.forEach((work) => {
      this._renderWorkoutMarker(work);
    });
  }

  _showForm(mapE) {
    this.#mapEvent = mapE;
    form.classList.remove("hidden");
    inputDistance.focus();
  }
  _hideForm() {
    //Empty inputs
    inputDistance.value =
      inputDuration.value =
      inputSpeed.value =
      inputSpeed.value =
        "";
    //Add hidden class
    form.style.display = "none";
    form.classList.add("hidden");
    setTimeout(() => (form.style.display = "grid"), 1000);
  }

  _toggledElevationField() {
    inputElevation.closest(".form__row").classList.toggle("form__row--hidden");
    inputSpeed.closest(".form__row").classList.toggle("form__row--hidden");
  }

  _newWorkout(e) {
    //Helper functions
    const validInputs = (...inputs) =>
      inputs.every((inp) => Number.isFinite(inp));
    const checkPositive = (...inputs) => inputs.every((inp) => inp > 0);

    e.preventDefault();
    //Getting Data from the form
    const type = inputType.value;
    const distance = +inputDistance.value;
    const duration = +inputDuration.value;
    const { lat, lng } = this.#mapEvent.latlng;
    let workout;
    //If workout is a run, create running object
    if (type === "running") {
      const speed = +inputSpeed.value;
      //Check if data is valid
      if (
        !validInputs(distance, duration, speed) ||
        !checkPositive(distance, duration, speed)
      )
        return alert("Inputs have to be positive numbers!");

      workout = new Running([lat, lng], distance, duration, speed);
    }

    //If workout is cycling, create cycling object
    if (type === "cycling") {
      const elevation = +inputElevation.value;
      //Check if data is valid
      if (
        !validInputs(distance, duration, elevation) ||
        !checkPositive(distance, duration)
      )
        return alert("Inputs have to be positive numbers!");
      workout = new Cycling([lat, lng], distance, duration, elevation);
    }

    //Add the new workout(object) to the workout array
    this.#workouts.push(workout);

    //Render workout on map as marker
    this._renderWorkoutMarker(workout);

    //Render workout onto the list
    this._renderWorkout(workout);

    //Hide form and clear the input fields
    this._hideForm();

    //Local storage
    this._setLocalStorage();
  }

  _renderWorkoutMarker(workout) {
    L.marker(workout.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${workout.type}-popup`,
        })
      )
      .setPopupContent(
        `${workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"} ${workout.description}`
      )
      .openPopup();
  }

  _renderWorkout(workout) {
    let html = `
      <li class="workout workout--${workout.type}" data-id="${workout.id}">
        <h2 class="workout__title">${workout.description}</h2>
        <div class="workout__details">
          <span class="workout__icon">${
            workout.type === "running" ? "🏃‍♂️" : "🚴‍♀️"
          }</span>
          <span class="workout__value">${workout.distance}</span>
          <span class="workout__unit">km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⏱</span>
          <span class="workout__value">${workout.duration}</span>
          <span class="workout__unit">min</span>
        </div>
    `;

    if (workout.type === "running")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.pace.toFixed(1)}</span>
          <span class="workout__unit">min/km</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">🦶🏼</span>
          <span class="workout__value">${workout.speed}</span>
          <span class="workout__unit">spm</span>
        </div>
      </li>
      `;

    if (workout.type === "cycling")
      html += `
        <div class="workout__details">
          <span class="workout__icon">⚡️</span>
          <span class="workout__value">${workout.speed.toFixed(1)}</span>
          <span class="workout__unit">km/h</span>
        </div>
        <div class="workout__details">
          <span class="workout__icon">⛰</span>
          <span class="workout__value">${workout.elev}</span>
          <span class="workout__unit">m</span>
        </div>
      </li>
      `;

    form.insertAdjacentHTML("afterend", html); //Adding Element at sibling at end of form
  }

  _moveToPopup(e) {
    const workoutEl = e.target.closest(".workout");
    console.log(workoutEl);

    if (!workoutEl) return;

    const workout = this.#workouts.find(
      (work) => work.id === workoutEl.dataset.id
    );
    console.log(workout);

    this.#map.setView(workout.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });
  }

  _setLocalStorage() {
    localStorage.setItem("workouts", JSON.stringify(this.#workouts));
  }

  _getLocalStorage() {
    const data = JSON.parse(localStorage.getItem("workouts"));

    if (!data) return;
    this.#workouts = data;
    this.#workouts.forEach((work) => {
      this._renderWorkout(work);
    });
  }
}

const app = new App();
