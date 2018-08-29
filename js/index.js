var map;
var infoWindow;
var directionsService;
var directionsDisplay;
var marker;
var myMarker;
var curLocation = {
  lat: 55,
  lng: -4
};

var lunchOptions = [];
var rejectedOptions = [];

function initMap() {
  map = new google.maps.Map(document.getElementById('map'), {
    center: curLocation,
    streetViewControl: false,
    fullscreenControl: false,

    zoomControlOptions: { position: google.maps.ControlPosition.LEFT_CENTER },
    mapTypeControlOptions: { position: google.maps.ControlPosition.LEFT_BOTTOM },

    zoom: 6
  });

  directionsService = new google.maps.DirectionsService;
  directionsDisplay = new google.maps.DirectionsRenderer({
    suppressMarkers: true
  });
  infoWindow = new google.maps.InfoWindow;

  directionsDisplay.setMap(map);

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {

      curLocation.lat = position.coords.latitude;
      curLocation.lng = position.coords.longitude;

      map.setCenter(curLocation);
      map.setZoom(16);
      markMyLocation(curLocation);

      var service = new google.maps.places.PlacesService(map);
      service.nearbySearch({
        location: curLocation,
        radius: 1000,
        type: ['restaurant'],
        openNow: true,
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
      lunchOptions.push(restaurant);
    }
    if (pagination.hasNextPage) pagination.nextPage();
    shuffleArray(lunchOptions);
    if (!marker) nextSuggestion();
  }
}

function propose(place) {
  var placeLoc = place.geometry.location;
  document.getElementById('suggestion-name').innerHTML = place.name;
  document.getElementById('suggestion-address').innerHTML = place.vicinity;
  createMarker(place);
  calculateAndDisplayRoute(placeLoc);
}

function calculateAndDisplayRoute(place) {
  directionsService.route({
    origin: curLocation,
    destination: place,
    travelMode: 'WALKING'
  }, function(response, status) {
    if (status === 'OK') {
      directionsDisplay.setDirections(response);
      document.getElementById('suggestion-distance').innerHTML = '(' + response.routes[0].legs[0].distance.text + ' away)';
    } else console.log('Directions request failed due to ' + status);
  });
}

function nextSuggestion() {
  if (lunchOptions.length > 0) {
    var suggestion = document.getElementById('suggestion');
    var findButton = document.getElementById('next-button');

    var transitionEvent = whichTransitionEvent();

    suggestion.classList.add('move-up');
    findButton.classList.add('move-right');

    var removeButtonMove = function() {
      findButton.classList.remove('move-right');
      if (transitionEvent) findButton.removeEventListener(transitionEvent, removeButtonMove);
    }

    var removeSuggestionMove = function() {
      suggestion.classList.remove('move-up');
      if (transitionEvent) suggestion.removeEventListener(transitionEvent, makeSuggestion);
    }

    var makeSuggestion = function() {
      var lunchProposition = lunchOptions.shift();
      rejectedOptions.push(lunchProposition);
      propose(lunchProposition);
      removeSuggestionMove();
    }

    if (transitionEvent) {
      suggestion.addEventListener(transitionEvent, makeSuggestion);
      findButton.addEventListener(transitionEvent, removeButtonMove);
    }
  } else {
    if (confirm('Out of suggestions. Go back through them?')) {
      lunchOptions = rejectedOptions.slice();
      rejectedOptions = [];
      shuffleArray(lunchOptions);
      nextSuggestion();
    }
  }
}

function createMarker(place) {
  if (marker) marker.setMap(null);
  marker = new google.maps.Marker({
    map: map,
    position: place.geometry.location,
    animation: google.maps.Animation.DROP
  });
  google.maps.event.addListener(marker, 'click', function() {
    infoWindow.setContent(place.name);
    infoWindow.open(map, this);
  });
}

function markMyLocation(location) {
  myMarker = new google.maps.Marker({
    map: map,
    position: location,
    animation: google.maps.Animation.DROP
  });
  google.maps.event.addListener(myMarker, 'click', function() {
    infoWindow.setContent('You are here');
    infoWindow.open(map, this);
  });
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function whichTransitionEvent() {
  var el = document.createElement('fakeelement');
  var transitions = {
    'transition':'transitionend',
    'OTransition':'oTransitionEnd',
    'MozTransition':'transitionend',
    'WebkitTransition':'webkitTransitionEnd'
  }

  for (var t in transitions) {
    if (el.style[t] !== undefined) return transitions[t];
  }
}