// -*- coding: utf-8; -*-
var sPath = window.location.pathname;
var sPage = sPath.substring(sPath.lastIndexOf('/') + 1);
var lang = "de";
if(sPage == "index_de.html") lang = "de";
if(sPage == "index_fr.html") lang = "fr";
if(sPage == "index_en.html") lang = "en";

i18n.init({lng:lang, resStore: resources()});


TerrainProfile = function() { }
TerrainProfile.prototype.map = null;
TerrainProfile.prototype.chart = null;
TerrainProfile.prototype.directionsDisplay = null;
TerrainProfile.prototype.geocoderService = null;
TerrainProfile.prototype.elevationService = null;
TerrainProfile.prototype.directionsService = null;
TerrainProfile.prototype.uriContent = null;
TerrainProfile.prototype.mousemarker = null;
TerrainProfile.prototype.markers = [];
TerrainProfile.prototype.polyline = null;
TerrainProfile.prototype.elevations = null;
TerrainProfile.prototype.SAMPLES = 512;
TerrainProfile.prototype.markerIcons = new Array("http://www.google.com/mapfiles/markerA.png",
                                        "http://www.google.com/mapfiles/markerB.png",
                                        "http://www.google.com/mapfiles/markerC.png",
                                        "http://www.google.com/mapfiles/markerD.png",
                                        "http://www.google.com/mapfiles/markerE.png",
                                        "http://www.google.com/mapfiles/markerF.png",
                                        "http://www.google.com/mapfiles/markerG.png",
                                        "http://www.google.com/mapfiles/markerH.png",
                                        "http://www.google.com/mapfiles/markerI.png",
                                        "http://www.google.com/mapfiles/markerJ.png",
                                        "http://www.google.com/mapfiles/markerK.png",
                                        "http://www.google.com/mapfiles/markerL.png",
                                        "http://www.google.com/mapfiles/markerM.png");


TerrainProfile.prototype.default_path = {
    // Zürich Bern
    latlngs: [
    [47.374, 8.530],
    [46.949,7.443]
    ],
    mapType: google.maps.MapTypeId.ROADMAP,
    travelMode: 'direct'
};

// adding ability to measure euclidean distance of polylines
google.maps.LatLng.prototype.kmTo = function(a) {
  var e = Math, ra = e.PI/180;
  var b = this.lat() * ra, c = a.lat() * ra, d = b - c;
  var g = this.lng() * ra - a.lng() * ra;
  var f = 2 * e.asin(e.sqrt(e.pow(e.sin(d/2), 2) + e.cos(b) * e.cos
			    (c) * e.pow(e.sin(g/2), 2)));
  return f * 6378.137;
} 
google.maps.Polyline.prototype.inKm = function(n){
  var a = this.getPath(n), len = a.getLength(), dist = 0;
  for(var i=0; i<len-1; i++){
    dist += a.getAt(i).kmTo(a.getAt(i+1));
  }
  return dist;
} 



TerrainProfile.prototype.createPermalink = function() {
  var self = this;
  
  var latlngs_string = "(";
  for (var i in self.markers) {
    latlngs_string += "(" + self.markers[i].getPosition().lat().toFixed(6) 
                          + "," 
                          + self.markers[i].getPosition().lng().toFixed(6) + "),"
  }
  latlngs_string += ")";
  
  var uri = new URI();
  uri.search("latlngs=" + latlngs_string + "&travelMode=" + document.getElementById("mode").value);
  location.href = uri;			  
}

// Takes an array of ElevationResult objects, draws the path on the map
// and plots the elevation profile on a GViz ColumnChart
TerrainProfile.prototype.plotElevation = function(results) {
  var self = this;
  
  self.elevations = results;
  
  var path = [];
  
  if (!results) {
    // sometimes we don't get any results. Then we do something bad.. wait a while
    console.log("sleep for a second");
    document.getElementById("loading").style.display="block";
    setTimeout(function() {  self.updateElevation();  }, 1000);
    return false;
  }
  document.getElementById("loading").style.display="none";
  
  for (var i = 0; i < results.length; i++) {
    path.push(self.elevations[i].location);
  }
  
  if (self.polyline) {
    self.polyline.setMap(null);
  }
  
  var polymap = null;
  var travelMode =  document.getElementById("mode").value;
  if (travelMode == 'direct') {
    polymap = self.map;
  }
  
  self.polyline = new google.maps.Polyline({
    path: path,
    strokeColor: "#000000",
    map: polymap
  });
  var totalLength = Math.floor(self.polyline.inKm()*10)/10;
  if (totalLength < 1) {
    totalLength = Math.floor(self.polyline.inKm()*1000)/1000;
  }
  
  var csv_content = "distance_km, height_m, lat, lng\n";
  var data = new google.visualization.DataTable();
  
  data.addColumn('number', 'Distance');
  data.addColumn('number', 'Elevation');
  data.addColumn({type: 'string', role: 'tooltip'});
  
  for (var i = 0; i < results.length; i++) {
    x = Math.round(1000*totalLength * i/self.SAMPLES)/1000;
    y = Math.round(self.elevations[i].elevation*10)/10;
    data.addRow([x,y, y + i18n.t(" Meter Höhe bei Kilometer ") + Math.round(x*100)/100]);
    csv_content += x + ", " + y + ", " + path[i].lat() + ", " + path[i].lng() + "\n";
  }
  
  document.getElementById('chart_div').style.display = 'block';
  document.getElementById('export_link').style.display = 'block';
  document.getElementById('permalink').style.display = 'block';
  
  self.chart.draw(data, {
    height: 300,
    legend: 'none',
    titleY: i18n.t('Höhe (m)'),
    titleX: i18n.t('Distanz (km), Total')+ " " + totalLength + ' [km]',
    pointSize: 2,
    focusBorderColor: '#00ff00'
  });
  uriContent = "data:application/octet-stream," + encodeURIComponent(csv_content);  
  document.getElementById('export_link').onclick = function() {
    myWindow=window.open('','','width=700,height=400');
    myWindow.document.write('<div id="csvPresentator" style="display:none;"><textarea id="txtCSV" cols="80" rows="20" ></textarea></div>');
    myWindow.focus()
    myWindow.document.getElementById("txtCSV").value = csv_content;
    myWindow.document.getElementById("csvPresentator").style.display = "block";
    if(navigator.appName != "Microsoft Internet Explorer")
        myWindow.document.getElementById("txtCSV").select();
    else {
        var range = myWindow.document.getElementById('txtCSV').createTextRange();
        range.collapse(true);
        range.moveStart('character', 0);
        range.moveEnd('character', csv_content.length);
        range.select();
    }
    
    return false;
  }
  //document.getElementById('export_link').href = uriContent;
  
}

// Remove the green rollover marker when the mouse leaves the chart
TerrainProfile.prototype.clearMouseMarker = function() {
  if (this.mousemarker != null) {
    this.mousemarker.setMap(null);
    this.mousemarker = null;
  }
}

// Geocode an address and add a marker for the result
TerrainProfile.prototype.addAddress = function() {
  var self = this;
  var address = document.getElementById('address').value;
  self.geocoderService.geocode({ 'address': address }, function(results, status) {
    document.getElementById('address').value = "";
    if (status == google.maps.GeocoderStatus.OK) {
      var latlng = results[0].geometry.location;
      self.addMarker(latlng, true, true);
      if (self.markers.length > 1) {
	var bounds = new google.maps.LatLngBounds();
	for (var i in markers) {
	  bounds.extend(markers[i].getPosition());
	}
	self.map.fitBounds(bounds);
      } else {
	self.map.fitBounds(results[0].geometry.viewport);
      }
    } else if (status == google.maps.GeocoderStatus.ZERO_RESULTS) {
      alert(i18n.t("Addresse nicht gefunden."));
    } else {
      alert(i18n.t("Addressensuche gescheitert."));
    }
  })
}

// Add a marker and trigger recalculation of the path and elevation
TerrainProfile.prototype.addMarker = function(latlng, doQuery, showOnMap) {
  var self = this;
  if (self.markers.length < 10) {
    
    var marker = new google.maps.Marker({
      position: latlng,
      title: ""+(self.markers.length+1),
      icon:self.markerIcons[self.markers.length],
      draggable: true
    })
    
    self.markers.push(marker);
    
    google.maps.event.addListener(marker, 'dragend', function(e) {
      self.updateElevation();
    });
    
    
    if (doQuery) {
      self.updateElevation();
    }
    
    if (showOnMap) {
      marker.setMap(self.map);
    }
    
    if (self.markers.length == 10) {
      document.getElementById('address').disabled = true;
    }
  } else {
    alert(i18n.t("Es können nicht mehr als 10 Punkte eingegeben werden"));
  }
}

TerrainProfile.prototype.clearPaths = function() {
  var self = this;
  
  if (self.polyline) {
    self.polyline.setMap(null);
  }
  
  self.directionsDisplay.setMap(null);
  
  for (var i in self.markers) {
    self.markers[i].setMap(null);
  }
}

// Trigger the elevation query for point to point
// or submit a directions request for the path between points
TerrainProfile.prototype.updateElevation = function() {
  var self = this;
  
  self.clearPaths();
  if (self.markers.length > 1) {
    var travelMode =  document.getElementById("mode").value;
    if (travelMode != 'direct') {
      self.calcRoute(travelMode);
    } else {
      var latlngs = [];
      for (var i in self.markers) {
        self.markers[i].setMap(self.map);
        latlngs.push(self.markers[i].getPosition())
      }
      self.elevationService.getElevationAlongPath({ 
	path: latlngs,
	samples: self.SAMPLES
      }, function (results) { self.plotElevation(results) } );
    }
  }
}

// Submit a directions request for the path between points and an
// elevation request for the path once returned
TerrainProfile.prototype.calcRoute = function(travelMode) {
  var self = this;
  var origin = self.markers[0].getPosition();
  var destination = self.markers[self.markers.length - 1].getPosition();
  
  var waypoints = [];
  for (var i = 1; i < self.markers.length - 1; i++) {
    waypoints.push({
      location: self.markers[i].getPosition(),
      stopover: true
    });
  }
  
  var request = {
    origin: origin,
    destination: destination,
    waypoints: waypoints
  };
  
  switch (travelMode) {
  case "bicycling":
    request.travelMode = google.maps.DirectionsTravelMode.BICYCLING;
    break;
  case "driving":
    request.travelMode = google.maps.DirectionsTravelMode.DRIVING;
    break;
  case "walking":
    request.travelMode = google.maps.DirectionsTravelMode.WALKING;
    break;
  }
  
  self.directionsService.route(request, function(response, status) {
    if (status == google.maps.DirectionsStatus.OK) {
      self.clearPaths();
      self.directionsDisplay.setMap(self.map);
      self.directionsDisplay.setDirections(response);
    } else if (status == google.maps.DirectionsStatus.ZERO_RESULTS) {
      alert(i18n.t("Could not find a route between these points"));
    } else {
      alert(i18n.t("Directions request failed"));
    }
  });
}

// Trigger a geocode request when the Return key is
// pressed in the address field
TerrainProfile.prototype.addressKeyHandler = function(e) {
  var self = this;
  var keycode;
  if (window.event) {
    keycode = window.event.keyCode;
  } else if (e) {
    keycode = e.which;
  } else {
    return true;
  }
  
  if (keycode == 13) {
    self.addAddress();
    return false;
  } else {
    return true;
  }
}

TerrainProfile.prototype.loadPath = function() {
  var self = this;
  
  self.reset();
  
  var my_path = self.default_path;
  
  // parse URI
  var uri = new URI;
  var params = URI.parseQuery(uri.query());
  if (params.latlngs){
    var converted_latlngs = params.latlngs.replace(/\(/g,"[").replace(/\)/g,"]");
    my_path.latlngs = eval(converted_latlngs);
  }			
  if (params.travelMode){
    my_path.travelMode = params.travelMode;
  }			
  
  self.map.setMapTypeId(my_path.mapType);
  document.getElementById('mode').value = my_path.travelMode;
  var bounds = new google.maps.LatLngBounds();
  for (var i = 0; i < my_path.latlngs.length; i++) {
    var latlng = new google.maps.LatLng(
      my_path.latlngs[i][0],
      my_path.latlngs[i][1]
    );
    self.addMarker(latlng, false, true);
    bounds.extend(latlng);
  }
  self.map.fitBounds(bounds);
  self.updateElevation();
}

// Clear all overlays, reset the array of points, and hide the chart
TerrainProfile.prototype.reset = function() {
  this.clearPaths();
  this.markers = [ ];
  document.getElementById('address').disabled = false;
  document.getElementById('chart_div').style.display = 'none';
  document.getElementById('export_link').style.display = 'none';
  document.getElementById('permalink').style.display = 'none';
}

TerrainProfile.prototype.initialize = function() {
  var self = this;
  self.directionsDisplay = new google.maps.DirectionsRenderer({draggable: true, 
							       preserveViewport: true,
							       suppressBicyclingLayer: true,
                                   });
  var myLatlng = new google.maps.LatLng(47.374, 8.530);
  var myOptions = {
    zoom: 1,
    center: myLatlng,
    mapTypeId: google.maps.MapTypeId.TERRAIN
  }
  
  self.map   = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
  self.chart = new google.visualization.AreaChart(document.getElementById('chart_div'));
  self.geocoderService   = new google.maps.Geocoder();
  self.elevationService  = new google.maps.ElevationService();
  self.directionsService = new google.maps.DirectionsService();
  self.directionsDisplay.setMap(this.map);    
  
  // check if the user has changed the direction and redo everything
  google.maps.event.addListener(this.directionsDisplay, 'directions_changed', function() {
    var route = self.directionsDisplay.getDirections().routes[0];
    self.markers =  [ ];
    self.addMarker(route.legs[0].start_location, false, false);
    for(var i in route.legs) {
      self.addMarker(route.legs[i].end_location, false, false);
    }
    var response = self.directionsDisplay.getDirections();
    self.elevationService.getElevationAlongPath({
      path: route.overview_path,
      samples: self.SAMPLES
    }, function(results) { self.plotElevation(results); });
  });
  
  google.maps.event.addListener(self.map, 'click', function(event) {
    self.addMarker(event.latLng, true, true);
  });
  
  google.visualization.events.addListener(self.chart, 'onmouseover', function(e) {
    if (self.mousemarker == null) {
      self.mousemarker = new google.maps.Marker({
	position: self.elevations[e.row].location,
	map: self.map,
	icon: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png"
      });
    } else {
      self.mousemarker.setPosition(self.elevations[e.row].location);
    }
  });
  
  self.loadPath();
}

// Load the Visualization API and the piechart package.
google.load("visualization", "1", {packages: ["corechart"]});

// Set a callback to run when the Google Visualization API is loaded.
var tp = new TerrainProfile();
google.setOnLoadCallback(function () { 
  tp.initialize(); 
});
