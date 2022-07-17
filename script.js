"use strict";
//Geo-Location
navigator.geolocation.getCurrentPosition(
  function (position) {
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.com/maps/@${latitude},${longitude}`);
  },
  function () {
    alert("Could not get your position");
  }
);
