var GMaps = require('../module/gmaps');
var mapStylesAdministrative = require('../module/map-styles');
var $$ = require('domtastic');
var template = require('../module/template');

if ($$(document.body).hasClass("single")) {
  var mapContainer = $$('[data-map-container]');
  if (mapContainer.length) {
    var mapContainerID = '#' + mapContainer.attr('id');
    var mapData = {
      id: mapContainer.attr('data-map-id'),
      title: mapContainer.attr('data-map-title'),
      thumbnail: mapContainer.attr('data-map-thumbnail'),
      lat: mapContainer.attr('data-map-lat'),
      long: mapContainer.attr('data-map-long'),
    };
    var mapSimple = new GMaps({
      div: mapContainerID,
      zoom: Number(upages_params.map_zoom),
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      lat: mapData.lat,
      lng: mapData.long,
      mapType: "roadmap",
      height: '250px',
      width: '100%',
      styles: mapStylesAdministrative,
      idle: function (e) {
  
        var markerContent = template('map-marker',mapData);
        
        mapSimple.drawOverlay({
          lat: mapData.lat,
          lng: mapData.long,
          content: markerContent,
          layer: 'overlayImage',
          verticalAlign: 'bottom',
          horizontalAlign: 'center'
        });
      }
    });
  }
}