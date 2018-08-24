var map;
var infoWindow;
var curLocation = {
  lat: 55,
  lng: -4
};

var lunchOptions = [];

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: curLocation,
    zoom: 6
  });

  infoWindow = new google.maps.InfoWindow;

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {

      curLocation.lat = position.coords.latitude;
      curLocation.lng = position.coords.longitude;

      infoWindow.setPosition(curLocation);
      infoWindow.setContent('Location found.');
      infoWindow.open(map);
      map.setCenter(curLocation);
      map.setZoom(16);

      var service = new google.maps.places.PlacesService(map);
      service.nearbySearch({
        location: curLocation,
        radius: 1000,
        type: ['restaurant']
      }, callback);
    }, function() {
      handleLocationError(true, infoWindow, map.getCenter());
    });
  } else {
    handleLocationError(false, infoWindow, map.getCenter());
  }
}

function handleLocationError(browserHasGeolocation, infoWindow, pos) {
  infoWindow.setPosition(pos);
  infoWindow.setContent(browserHasGeolocation ?
                        'Error: The Geolocation service failed.' :
                        'Error: Your browser does not support geolocation.');
  infoWindow.open(map);
}

function callback(results, status, pagination) {
  if (status === google.maps.places.PlacesServiceStatus.OK) {
    for (var i = 0; i < results.length; i++) {
      var restaurant = results[i];
      if (restaurant.hasOwnProperty('opening_hours') && restaurant.opening_hours.open_now) {
        lunchOptions.push(restaurant);
        createMarker(restaurant);
      }
    }
    if (pagination.hasNextPage) pagination.nextPage();
  }
}

function createMarker(place) {
  var placeLoc = place.geometry.location;
  var marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location
  });

  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent(place.name);
    infoWindow.open(map, this);
  });
}
