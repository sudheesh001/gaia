var files = undefined;

window.onload = function() {
  navigator.mozSetMessageHandler('activity', function(activityRequest) {
    if (activityRequest.source.name === 'share-filenames') {
      clean();
      addImages(activityRequest.source.data.filenames);
    }
  });
};

function uploadCanardPc(source, callback) {
  var url = "http://tof.canardpc.com/";

  var picture = new FormData();
  picture.append('email', "");
  picture.append('envoyer', "envoyer");
  picture.append('fichier', source);

  var xhr = new XMLHttpRequest({mozSystem: true});
  xhr.open("POST", url, true);
  xhr.upload.addEventListener("progress", function(e) {
    if (e.lengthComputable) {
      setProgress(e.loaded, e.total);
    }
  }, false);
  xhr.upload.addEventListener("load", function(e) {
      setProgress(e.loaded, e.total);
  }, false);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == XMLHttpRequest.DONE) {
        if (xhr.responseText.match(url + "show/")) {
          var re = new RegExp(url + "show/(.*).html");
          var ar = re.exec(xhr.responseText);
          var pid = ar[1];
	  var up = ar[0];
          setStatus("Uploaded successfully: " + pid);
          callback(up);
        } else {
          setStatus("Error while uploading!");
        }
      unlock();
    }
  };
  xhr.send(picture);
}

function addImages(filenames) {
  var storage = navigator.getDeviceStorage('pictures');
  filenames.forEach(function(filename) {
    storage.get(filename).onsuccess = function(e) {
      var blob = e.target.result;
      var url = URL.createObjectURL(blob);
      var holder = document.getElementById('previews');
      var img = document.createElement('img');
      img.style.width = '85%';
      img.src = url;
      files[url] = blob;
      img.onload = function() { URL.revokeObjectURL(this.src); };
      holder.appendChild(img);
    };
  });
}

function getSelectedServices() {
  var services = document.getElementsByTagName("input");
  var selectedServices = [];
  for (var service in services) {
    var s = services[service];
    if (s.type === "checkbox" && s.checked === true) {
      selectedServices.push(s.id);
    }
  }
  return selectedServices;
}

function finalize(url) {
  var zoneResults = document.getElementById("link");
  if (zoneResults) {
    var link = document.createElement('a');
    link.href = url;
    link.textContent = "Link to uploaded";
    zoneResults.appendChild(link);
  }

  new MozActivity({
    name: 'view',
    data: {
      type: 'url',
      url: url
    }
  });
}

function share() {
  var services = getSelectedServices();
  if (services.length > 0) {
    for (var sn in services) {
      lock();
      var serv = services[sn];
      var imgs = document.getElementById("previews").getElementsByTagName("img");
      for (var i in imgs) {
      	var img_url = imgs[i].src;
	if (img_url != undefined) {
	  var img = files[img_url];
	  switch (serv) {
            case "upload-canardpc":
	      uploadCanardPc(img, finalize);
	      break;
	  }
	}
      }
    }
  }
}

function purge(id) {
  var prevs = document.getElementById(id);
  if (prevs) {
    while (prevs.hasChildNodes()) {
      prevs.removeChild(prevs.lastChild);
    }
  }
}

function clean() {
  files = {};
  setStatus("");
  setProgress(0.0, 0.0);
  purge('previews');
  purge('link');
  unlock();
}

function lock() {
  document.getElementById("share").disabled = true;
}

function unlock() {
  document.getElementById("share").disabled = false;
}

function setStatus(msg) {
  document.getElementById("uploaded").value = msg;
}

function setProgress(level, max) {
  document.getElementById("progress").value = level + "/" + max;
}
