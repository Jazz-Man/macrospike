var GMaps = require('../module/gmaps');
var mapStylesAdministrative = require('../module/map-styles');
var $$ = require('domtastic');

if ($$(document.body).hasClass('add-listing')) {
  var input_adress = $$('.input-address');
  var input_lat = $$('.input-lat');
  var input_lng = $$('.input-lng');
  var input = document.getElementById('listing_address');
  var searchBox = new google.maps.places.SearchBox(input);
  var map = new GMaps({
    div: '#map',
    zoom: 5,
    zoomControl: false,
    mapTypeControl: false,
    scaleControl: false,
    streetViewControl: false,
    lat: 48.9257791,
    lng: 24.692838,
    mapType: "roadmap",
    height: '400px',
    width: '100%',
    styles: mapStylesAdministrative,
    bounds_changed: function (e) {
      searchBox.setBounds(map.map.getBounds());
    }
  });
  searchBox.addListener('places_changed', function () {
    var places = searchBox.getPlaces();
    if (places.length == 0) {
      return;
    }
    
    var bounds = new google.maps.LatLngBounds();
    places.forEach(function (place) {
      
      input_adress.val(place.formatted_address);
      input_lat.val(place.geometry.location.lat());
      input_lng.val(place.geometry.location.lng());
      
      var markerContent = '<div class="marker">' +
                          '<div class="title">' + place.name + ', ' + place.vicinity + '</div>' +
                          '<div class="marker-wrapper">' +
                          '<div class="tag"><i class="fa fa-check"></i></div>' +
                          '<div class="pin">' +
                          '<div class="image"></div>' +
                          '</div>' +
                          '</div>' +
                          '</div>';
      
      map.drawOverlay({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        content: markerContent,
        layer: 'overlayImage',
        verticalAlign: 'bottom',
        horizontalAlign: 'center'
      });
      
      if (place.geometry.viewport) {
        bounds.union(place.geometry.viewport);
      }
      else {
        bounds.extend(place.geometry.location);
      }
    });
    map.map.fitBounds(bounds);
  });
}