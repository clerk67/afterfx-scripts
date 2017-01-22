#include "json2.js"
#include "indexof.js"

var DEFAULT_DURATION = 5.0;
var MINIMUM_INTERVAL = 2.0 / 3;
var PROJECT_PATH = "C:/Users//maruk//Creative Cloud Files//aep//";

var comp = app.project.activeItem;
var fps = comp.frameRate;
var dstLayer = comp.layer("topTextDst");
var topLayer = comp.layer("top1");
var topLayerJa1 = comp.layer("topTextJp1");
var topLayerEn1 = comp.layer("topTextEn1");
var topLayerJa2 = comp.layer("topTextJp2");
var topLayerEn2 = comp.layer("topTextEn2");
var topLayerJa3 = comp.layer("topTextJp3");
var topLayerEn3 = comp.layer("topTextEn3");
var guideLayer = comp.layer("pointName");
var routeLayer = comp.layer("routeName");
var routeNumLayer = comp.layer("routeNumber");
var cityLayer = comp.layer("cityName");
var tunnelLayer = comp.layer("tunnel/bridge");
var bridgeLayer = comp.layer("tunnel/bridge");
var tunnelLengthLayer = comp.layer("tunnel/bridgeLength");
var bridgeLengthLayer = comp.layer("tunnel/bridgeLength");
var routeNameLength = null;
var tunnelNameLength = null;
var bridgeNameLength = null;
var lastDirectionTime = 0;

var project = app.project["file"].toString();
var matches = project.match(/\/(\d{3})_(\d{2})\.aep$/);
var file = new File(PROJECT_PATH + matches[1] + "//json//" + matches[2] + ".json");

if (file.open("r")) {
  var data = JSON.parse(file.read());
  data = data.sort(sortByTime);
  for (var i = 0; i < data.length; i++) {
    if (data[i]["directions"] !== undefined) {
      addDirection(data[i]);
    } else if (data[i]["distance"] !== undefined) {
      addDistance(data[i]);
    } else if (data[i]["guide"] !== undefined) {
      addGuideMarker(data[i]);
    } else if (data[i]["route"] !== undefined) {
      addRouteMarker(data[i]);
    } else if (data[i]["city"] !== undefined) {
      addCityMarker(data[i]);
    } else if (data[i]["tunnel"] !== undefined) {
      addTunnel(data[i]);
    } else if (data[i]["bridge"] !== undefined) {
      addBridge(data[i]);
    } else {
      $.writeln("[ERROR] Unknown type: index(" + i + ")");
    }
  }
  alert("JSON was successfully processed.");
} else {
  alert("Failed to read JSON.");
}

file.close();

function sortByTime(a, b) {
  return parseInt(a["time"]) - parseInt(b["time"]);
}

function addDirection(data) {
  var direction = "";
  var routes = ["", "", ""];
  if (data["time"] - lastDirectionTime < DEFAULT_DURATION * fps) {
    var duration = (data["time"] - lastDirectionTime) / fps - MINIMUM_INTERVAL;
  } else {
    var duration = DEFAULT_DURATION;
  }
  lastDirectionTime = data["time"];
  for (var j = 0; j < data["directions"].length && j < 3; j++) {
    direction += data["directions"][j]["direction"];
    if (data["directions"][j]["route"] !== undefined) {
      routes[j] = data["directions"][j]["route"];
    } else {
      routes[j] = "";
    }
    var name_ja = "";
    var name_en = "";
    for (var k = 0; k < data["directions"][j]["name_ja"].length; k++) {
      name_ja += data["directions"][j]["name_ja"][k] + "\n";
      name_en += data["directions"][j]["name_en"][k] + "\n";
      if (data["directions"][j]["name_ja"][k].length > 5) {
        $.writeln("[WARN] topTextJp" + (j + 1) + "@" + data["time"] + " \"" + data["directions"][j]["name_ja"][k] + "\"");
      }
    }
    if (j == 0) {
      topLayerJa1.text.sourceText.setValueAtTime(data["time"] / fps - duration, name_ja);
      topLayerEn1.text.sourceText.setValueAtTime(data["time"] / fps - duration, name_en);
    } else if (j == 1) {
      topLayerJa2.text.sourceText.setValueAtTime(data["time"] / fps - duration, name_ja);
      topLayerEn2.text.sourceText.setValueAtTime(data["time"] / fps - duration, name_en);
    } else if (j == 2) {
      topLayerJa3.text.sourceText.setValueAtTime(data["time"] / fps - duration, name_ja);
      topLayerEn3.text.sourceText.setValueAtTime(data["time"] / fps - duration, name_en);
    }
  }
  var marker = new MarkerValue(direction);
  marker.duration = duration;
  marker.chapter = routes[0];
  marker.url = routes[1];
  marker.frameTarget = routes[2];
  topLayer.property("Marker").setValueAtTime(data["time"] / fps, marker);
}

function addDistance(data) {
  var marker = new MarkerValue("");
  if (data["route"] !== undefined) {
    marker.chapter = data["route"];
  } else {
    marker.chapter = "";
  }
  topLayer.property("Marker").setValueAtTime(data["time"] / fps + DEFAULT_DURATION, marker);
  var distance = "";
  var name_ja = "";
  var name_en = "";
  for (var j = 0; j < data["distance"].length; j++) {
    distance += data["distance"][j] + "\n";
    name_ja += data["name_ja"][j] + "\n";
    name_en += data["name_en"][j] + "\n";
    if (data["name_ja"][j].length > 5) {
      $.writeln("[WARN] topTextJp1@" + Math.round(data["time"] + DEFAULT_DURATION * fps) + " \"" + data["name_ja"][j] + "\"");
    }
  }
  dstLayer.text.sourceText.setValueAtTime(data["time"] / fps, distance);
  topLayerJa1.text.sourceText.setValueAtTime(data["time"] / fps, name_ja);
  topLayerEn1.text.sourceText.setValueAtTime(data["time"] / fps, name_en);
}

function addGuideMarker(data) {
  var marker = new MarkerValue(data["name"]);
  marker.chapter = data["guide"];
  guideLayer.property("Marker").setValueAtTime(data["time"] / fps, marker);
}

function addRouteMarker(data) {
  var prefix = "";
  var number = "";
  if (data["route"].substr(0, 1) === "R") {
    prefix = "⑯";
    number = data["route"].substr(1);
  } else if (data["route"].substr(0, 1) === "r") {
    prefix = "⑰";
    number = data["route"].substr(1);
  } else if (data["route"] === "NEXCO") {
    prefix = "㈱";
  }
  var marker = new MarkerValue(number);
  marker.chapter = prefix;
  routeNumLayer.property("Marker").setValueAtTime(data["time"] / fps, marker);
  var routeName = data["name"];
  if (prefix == "㈱") {
    routeName = " " + routeName;
  }
  var bytes = 0;
  for (var j = 0; j < routeName.length; j++) {
    bytes += (routeName.charCodeAt(j) < 256) ? 1 : 2;
  }
  routeNameLength = bytes;
  marker = new MarkerValue(routeName);
  routeLayer.property("Marker").setValueAtTime(data["time"] / fps, marker);
}

function addCityMarker(data) {
  var marker = new MarkerValue(data["city"]);
  cityLayer.property("Marker").setValueAtTime(data["time"] / fps, marker);
}

function addTunnel(data) {
  var startTime = 0;
  var endTime = 0;
  if (data["time"][1] !== undefined) {
    startTime = data["time"][0] / fps;
    endTime = data["time"][1] / fps;
  } else {
    startTime = data["time"] / fps;
    endTime = startTime + DEFAULT_DURATION;
  }
  sourceText = data["tunnel"];
  for (var j = 0; j < routeNameLength + 1; j++) {
    sourceText = " " + sourceText;
  }
  tunnelLayer.text.sourceText.setValueAtTime(startTime, sourceText);
  tunnelLayer.text.sourceText.setValueAtTime(endTime, "");
  if (data["length"] !== undefined) {
    tunnelLength = " " + data["length"] + " m";
    for (var j = 0; j < sourceText.length; j++) {
      if (sourceText.charCodeAt(j) < 256) {
        tunnelLength = "  " + tunnelLength;
      } else {
        tunnelLength = "    " + tunnelLength;
      }
    }
    tunnelLengthLayer.text.sourceText.setValueAtTime(startTime, tunnelLength);
    tunnelLengthLayer.text.sourceText.setValueAtTime(endTime, "");
  }
}

function addBridge(data) {
  var startTime = 0;
  var endTime = 0;
  if (data["time"][1] !== undefined) {
    startTime = data["time"][0] / fps;
    endTime = data["time"][1] / fps;
  } else {
    startTime = data["time"] / fps;
    endTime = startTime + DEFAULT_DURATION;
  }
  sourceText = data["bridge"];
  if (data["length"] !== undefined) {
    sourceText += " " + data["length"] + " m";
  }
  for (var j = 0; j < routeNameLength + 1; j++) {
    sourceText = " " + sourceText;
  }
  bridgeLayer.text.sourceText.setValueAtTime(startTime, sourceText);
  bridgeLayer.text.sourceText.setValueAtTime(endTime, "");
  if (data["length"] !== undefined) {
    bridgeLength = " " + data["length"] + " m";
    for (var j = 0; j < sourceText.length; j++) {
      if (sourceText.charCodeAt(j) < 256) {
        bridgeLength = "  " + bridgeLength;
      } else {
        bridgeLength = "    " + bridgeLength;
      }
    }
    bridgeLengthLayer.text.sourceText.setValueAtTime(startTime, bridgeLength);
    bridgeLengthLayer.text.sourceText.setValueAtTime(endTime, "");
  }
}
