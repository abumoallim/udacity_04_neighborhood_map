'use strict';

function viewModel() {
  var self = this;
  var map ;

  //static locations data
  var locations = [
    {title: 'Burj khalifa', location: {lat: 25.1972, lng: 55.2744}},
    {title: 'Burj Al arab', location: {lat: 25.1413, lng: 55.1853}},
    {title: 'Palm Jumeirah', location: {lat: 25.1124 , lng: 55.1390}},
    {title: 'Dubai Marina', location: {lat: 25.0805 , lng: 55.1403}},
    {title: 'The Dubai Fountain', location: {lat: 25.1956 , lng: 55.2755}},
    {title: 'Wild Wadi Water Park', location: {lat: 25.1394 , lng: 55.1888}},
    {title: 'Grand Mosque', location: {lat: 25.2642 , lng: 55.2967}},
    {title: 'The Dubai Mall', location: {lat: 25.1973 , lng: 55.2793}},
    {title: 'Ski Dubai', location: {lat: 25.1172 , lng: 55.1983}},
    {title: 'Madinat Jumeirah', location: {lat: 25.1331 , lng: 55.1835}},
    {title: 'Jumeirah Mosque', location: {lat: 25.2338 , lng: 55.2655}},
    {title: 'Al Bastakiya', location: {lat: 25.2644 , lng: 55.2999}},
    {title: 'Dubai Spice Souk', location: {lat: 25.2675 , lng: 55.2969}},
    {title: 'The Lost Chambers Aquarium', location: {lat: 25.1319 , lng: 55.1184}},
    {title: 'Palm Islands', location: {lat: 25.0032, lng: 55.0204}},
  ];

  //creating markers and search observable
  self.markers = ko.observableArray();
  self.search = ko.observable("");

  //button for drawing tools
  self.buttonText = ko.observable("Drawing Tools");

  //initializing map and markers
  self.initMap = function() {
      // This global polygon variable is to ensure only ONE polygon is rendered.
      var polygon = null;

      // infoWindow initialization
      var largeInfowindow = new google.maps.InfoWindow();

      // Initialize the drawing manager for drawing tools
      var drawingManager = new google.maps.drawing.DrawingManager({
        drawingMode: google.maps.drawing.OverlayType.POLYGON,
        drawingControl: true,
        drawingControlOptions: {
          position: google.maps.ControlPosition.TOP_LEFT,
          drawingModes: [
            google.maps.drawing.OverlayType.POLYGON
          ]
        }
      });

      //highligthing markers
      var highlightedIcon = makeMarkerIcon('FFFF24');
      var defaultIcon = makeMarkerIcon('0091ff');

      //toggle for drawing tools
      self.toggleData = function() {
        toggleDrawing(drawingManager);
      }

      //creating map instance
      map = new google.maps.Map(document.getElementById('map'), {
          zoom: 11,
          center: {lat: 25.2048, lng: 55.2708},
      });

      // The following method uses the location array to create an array of markers on initialize.
      addMarkers(locations,map,self.markers,defaultIcon,largeInfowindow,highlightedIcon);

      // Add an event listener so that the polygon is captured,  call the
      // searchWithinPolygon function. This will show the markers in the polygon,
      // and hide any outside of it.
      drawingManager.addListener('overlaycomplete', function(event) {
        // First, check if there is an existing polygon.
        // If there is, get rid of it and remove the markers
        if (polygon) {
          polygon.setMap(null);
        }
        // Switching the drawing mode to the HAND (i.e., no longer drawing).
        drawingManager.setDrawingMode(null);
        // Creating a new editable polygon from the overlay.
        polygon = event.overlay;
        polygon.setEditable(true);
        // Searching within the polygon.
        searchWithinPolygon();
        // Make sure the search is re-done if the poly is changed.
        polygon.getPath().addListener('set_at', searchWithinPolygon);
        polygon.getPath().addListener('insert_at', searchWithinPolygon);
      });

      // This shows and hides (respectively) the drawing options.
      function toggleDrawing(drawingManager) {
        self.buttonText(self.buttonText() === 'Drawing Tools' ? 'Remove Tools' : 'Drawing Tools');
        if (drawingManager.map) {
          console.log('drawing tools disabled')
          drawingManager.setMap(null);
          // In case the user drew anything, get rid of the polygon
          showAllMarkers(self.markers());

          if (polygon !== null) {
            polygon.setMap(null);
          }
        } else {
          hideAllMarkers(self.markers());
          drawingManager.setMap(map);
        }
      }

      // This function hides all markers outside the polygon,
      // and shows only the ones within it. This is so that the
      // user can specify an exact area of search.
      function searchWithinPolygon() {
        for (var i = 0; i < self.markers().length; i++) {
          if (google.maps.geometry.poly.containsLocation(self.markers()[i].position, polygon)) {
            self.markers()[i].setVisible(true);
          }else{
            self.markers()[i].setVisible(false);
          }
        }
      }
  }  

  self.initMap();

  //this function filters the location list
  self.filteredMarkers = ko.computed(function() {
    var locations = [];
    var search = self.search();
    for (var i=0; i < self.markers().length; i++) {
        var marker = self.markers()[i];
        if (!search || marker.title.toLowerCase().includes(search.toLowerCase())) {
            locations.push(marker);
            self.markers()[i].setVisible(true);
        } else {
            self.markers()[i].setVisible(false);

        }
    }
    return locations;
  }); 

}

function showAllMarkers(markers){
  console.log("show",markers.length);
  for (var i=0; i <markers.length; i++) {
    markers[i].setVisible(true);
   }
}

function hideAllMarkers(markers){
  console.log("hide",markers.length);
  for (var i=0; i < markers.length; i++) {
    markers[i].setVisible(false);
   }
}

function addMarkers(locations,map,markers,defaultIcon,largeInfowindow,highlightedIcon){
  for (var i = 0; i < locations.length; i++) {
        
    // Get the position from the location array.
    var position = locations[i].location;
    var title = locations[i].title;
    // Create a marker per location, and put into markers array.
    var marker = new google.maps.Marker({
      map: map,
      position: position,
      title: title,
      animation: google.maps.Animation.DROP,
      icon: defaultIcon,
      id: i
    });
    // Push the marker to our array of markers.
    markers.push(marker);
    // Create an onclick event to open an infowindow at each marker.
    marker.addListener('click', function() {
      populateInfoWindow(this, largeInfowindow);
    });
    marker.addListener('mouseover', function() {
      this.setIcon(highlightedIcon);
    });
    marker.addListener('mouseout', function() {
      this.setIcon(defaultIcon);
    });
  }
}

// This function populates the infowindow when the marker is clicked. We'll only allow
// one infowindow which will open at the marker that is clicked, and populate based
// on that markers position.
function populateInfoWindow(marker, largeInfowindow) {
  // Check to make sure the infowindow is not already opened on this marker.
        if (largeInfowindow.marker != marker) {
          // nothing to do if already highlighted marker is clicked
          largeInfowindow.setContent('Loading...');
          largeInfowindow.marker = marker;
          var htmlContent = '<div class="info-window">' +
              '<h4 class="title">' + marker.title + '</h4>';
          // Foursquare API Client
          var fourSquareId = "UXXQHWQVCYFFAKZEGXTVRHAHEE4BSK3CK5HYBSN022IYYFLZ";
          var fourSquareSecret = "AXRXEJK0USQO1ICOL22QLMWSRLEPV3QVIENPMNWNGEPAYPAR";
          // URL for Foursquare API
          var apiUrl = 'https://api.foursquare.com/v2/venues/search?' +
              'll=' + marker.position.lat() + ',' + marker.position.lng() +
              '&query=' + marker.title +
              '&v=20180323' +
              '&client_id=' + fourSquareId +
              '&client_secret=' + fourSquareSecret;
          // Foursquare API
          $.getJSON(apiUrl).done(function(marker) {
              if(!marker.response.venues) {
                largeInfowindow.setContent(htmlContent +
                                        '<p>No extra info found.</p>');
                  return null;
              }
              let response = marker.response.venues[0];
              var lat = response.location.lat;
              var lng = response.location.lng;
              var address = response.location.address ||
                  response.location.formattedAddress[0];

              var htmlContentFourSquare = '<p><strong>Address:</strong> ' +
                  address + '<br><strong>Lat:</strong> ' + lat +
                  '<br><strong>Lng:</strong> ' + lng + '</p></div>';

                  largeInfowindow.setContent(htmlContent + htmlContentFourSquare);
          }).fail(function() {
              largeInfowindow.setContent("Erred while fetching data from the Foursquare API." +
                                         " Kindly refresh the page to retry.");

          });

          largeInfowindow.open(map, marker);

          largeInfowindow.addListener('closeclick', function() {
              infoWindow.marker = null;
          });
      }
}


// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
  var markerImage = new google.maps.MarkerImage(
    'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
    '|40|_|%E2%80%A2',
    new google.maps.Size(21, 34),
    new google.maps.Point(0, 0),
    new google.maps.Point(10, 34),
    new google.maps.Size(21,34));
  return markerImage;
}
 
function initMap() {
  ko.applyBindings(new viewModel());
}
