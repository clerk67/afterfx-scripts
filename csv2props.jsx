// minimum keyframe interval in second for assuming stop signal
var MIN_STOP_DURATION = 1.00;

// maximum next preceding velocity for assuming stop signal
var MAX_EDGE_VELOCITY = 120;

// maximum composition frame index
var MAX_FRAME = 54000;

// var panel = this;
// var button = panel.add('button', [10, 10, 100, 30], 'parse CSV');

(function() {

  var fileObj = File.openDialog();
  var flag = fileObj.open('r');

  if (flag == true)　{
    var sec = [];
    var dst = [];
    var lat = [];
    var lon = [];
    var alt = [];
    var dir = [];
    var fps = prompt('fps?', 30);
    var playSpeed = prompt('playSpeed?', 5);
    var videoCapturedAt, videoCaptured;
    while (true) {
      videoCapturedAt = prompt('videoCapturedAt?', '000000');
      if (videoCapturedAt.length != 6) continue;
      var vc_h = parseInt(videoCapturedAt.substr(0, 2));
      var vc_m = parseInt(videoCapturedAt.substr(2, 2));
      var vc_s = parseInt(videoCapturedAt.substr(4, 2));
      if (vc_h >= 24 || vc_m >= 60 || vc_s >= 60) continue;
      videoCaptured = parseInt(vc_s) + 60 * vc_m + 3600 * vc_h;
      if (!isNaN(videoCaptured)) break;
    }
    var videoInPoint = prompt('videoInPoint?', 0);
    var offset = prompt('offset?', 0);
    var startFrame = -1, csvFirstEntry = -1;

    // skip header lines
    fileObj.readln();
    fileObj.readln();
    fileObj.readln();
    fileObj.readln();

    var i = 0;
    while (true) {
      var text = fileObj.readln().replace(/"/g, '');
      if (text.length == 0) break;
      var chr = text.split(',');
      var date = chr[8].split('T');
      var time = date[1].split(':');

      lat[i] = parseFloat(chr[2]);
      lon[i] = parseFloat(chr[3]);
      alt[i] = parseInt(chr[4]);
      dir[i] = parseInt(chr[5]);

      if (i == 0) {
        csvFirstEntry = parseFloat(time[2].substr(0, 6)) + 60 * time[1] + 3600 * (parseInt(time[0]) + 9);
        startFrame = parseInt(videoInPoint) + (csvFirstEntry - videoCaptured) * fps + parseInt(offset);

        // ignore auto time adjustment
        startFrame = 0;

        sec0 = parseFloat(time[2].substr(0, 6)) + 60 * time[1] + 3600 * time[0];
        sec[0] = startFrame / fps;
        dst[0] = 0;
        dir[0] = 0;
      } else {
        sec[i] = startFrame / fps + (parseFloat(time[2].substr(0,6)) + 60 * time[1] + 3600 * time[0] - sec0) / playSpeed;
        if (/*sec[i] < sec[i - 1] ||*/ sec[i] < 0) {
          sec[i] += 3600 * 24 / playSpeed;
        }
        if (sec[i] < 0 || sec[i] > MAX_FRAME / fps) {
          $.writeln('Invalid time: ' + sec[i] + ' (' + chr[8] + ')');
          // break;
        }
        dst[i] = dst[i - 1] + parseFloat(chr[7]) * (sec[i] - sec[i - 1]) * playSpeed / 1000;
        if (i > 1 && sec[i] - sec[i - 1] > MIN_STOP_DURATION) {
          var edgeVelocity = (dst[i - 1] - dst[i - 2]) / (sec[i - 1] - sec[i - 2]) * 3600;
          if (edgeVelocity < MAX_EDGE_VELOCITY) {
            dst[i] = dst[i - 1];
            alt[i] = alt[i - 1];
            dir[i] = dir[i - 1];
          }
        }
        if (isNaN(dir[i])) {
          dir[i] = dir[i - 1];
        }
        while (dir[i - 1] - dir[i] > 270) {
          dir[i] += 360;
        }
        while (dir[i] - dir[i - 1] > 270) {
          dir[i] -= 360;
        }
      }
      i++;
    }

    var AEdst = app.project.activeItem.layer('param').effect.dst.Slider;
    var AElat = app.project.activeItem.layer('param').effect.lat.Slider;
    var AElon = app.project.activeItem.layer('param').effect.lon.Slider;
    var AEalt = app.project.activeItem.layer('param').effect.alt.Slider;
    var AEdir = app.project.activeItem.layer('param').effect.dir.Angle;

    app.project.activeItem.layer('param').effect.altMax.Slider.setValue(Math.max(500, Math.max.apply(null, alt)));

    AEdst.setValuesAtTimes(sec, dst);
    AElat.setValuesAtTimes(sec, lat);
    AElon.setValuesAtTimes(sec, lon);
    AEalt.setValuesAtTimes(sec, alt);
    AEdir.setValuesAtTimes(sec, dir);
    alert(i + ' frames were imported successfully.');
    fileObj.close();

  } else {
    alert('CSV file is not found.');
  }
})();
