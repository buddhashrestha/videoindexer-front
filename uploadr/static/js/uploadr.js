/******************************************************************************
 * HTML5 Multiple File Uploader Demo                                          *
 ******************************************************************************/

// Constants
var MAX_UPLOAD_FILE_SIZE = 1024*1024; // 1 MB
var UPLOAD_URL = "/upload";
var NEXT_URL   = "/files/";

// List of pending files to handle when the Upload button is finally clicked.
var PENDING_FILES  = [];

//$("button").click(function(){
//    var color = clicked ? 'red' : 'blue';
//    $(this).css('background-color', color);
//    clicked = !clicked;
//});

$(document).ready(function() {
    // Set up the drag/drop zone.
    initDropbox();

    // Set up the handler for the file input box.
    $("#file-picker").on("change", function() {
        handleFiles(this.files);
    });

    // Handle the submit button.
    $("#upload-button").on("click", function(e) {
        // If the user has JS disabled, none of this code is running but the
        // file multi-upload input box should still work. In this case they'll
        // just POST to the upload endpoint directly. However, with JS we'll do
        // the POST using ajax and then redirect them ourself when done.
        var x;
        x = document.getElementById("file-picker").value;
        if (x == "") {
            alert("Add atleast one person.");
            return false;
        }else{
            e.preventDefault();
            doUpload();
        }

    })
});


function clearFiles(){
        var clearing = document.getElementById("file-picker")
        clearFileInput(clearing);
        PENDING_FILES = []
        return
}

function clearFileInput(ctrl) {
  try {
    ctrl.value = null;
    document.getElementById("list").innerHTML = ""
  } catch(ex) { }
  if (ctrl.value) {
    ctrl.parentNode.replaceChild(ctrl.cloneNode(true), ctrl);
  }
}
function doUpload() {
    $("#progress").show();
    var $progressBar   = $("#progress-bar");

    // Gray out the form.
    $("#upload-form :input").attr("disabled", "disabled");

    // Initialize the progress bar.
    $progressBar.css({"width": "0%"});

    // Collect the form data.
    fd = collectFormData();

    // Attach the files.
    for (var i = 0, ie = PENDING_FILES.length; i < ie; i++) {
        // Collect the other form data.
        fd.append("file", PENDING_FILES[i]);
    }

    // Inform the back-end that we're doing this over ajax.
    fd.append("__ajax", "true");

    var xhr = $.ajax({
        xhr: function() {
            var xhrobj = $.ajaxSettings.xhr();
            if (xhrobj.upload) {
                xhrobj.upload.addEventListener("progress", function(event) {
                    var percent = 0;
                    var position = event.loaded || event.position;
                    var total    = event.total;
                    if (event.lengthComputable) {
                        percent = Math.ceil(position / total * 100);
                    }

                    // Set the progress bar.
                    $progressBar.css({"width": percent + "%"});
                    $progressBar.text(percent + "%");
                }, false)
            }
            return xhrobj;
        },
        url: UPLOAD_URL,
        method: "POST",
        contentType: false,
        processData: false,
        cache: false,
        data: fd,
        success: function(data) {
            $progressBar.css({"width": "100%"});
            data = JSON.parse(data);

            // How'd it go?
            if (data.status === "error") {
                // Uh-oh.
                window.alert(data.msg);
                $("#upload-form :input").removeAttr("disabled");
                return;
            }
            else {
                // Ok! Get the UUID.
                var uuid = data.msg;
                var query_type = data.query_type;
                window.location = NEXT_URL + uuid+"?query_type="+query_type;
            }
        },
    });
}


function collectFormData() {
    // Go through all the form fields and collect their names/values.
    var fd = new FormData();

    $("#upload-form :input").each(function() {
        var $this = $(this);
        var name  = $this.attr("name");
        var type  = $this.attr("type") || "";
        var value = $this.val();

        // No name = no care.
        if (name === undefined) {
            return;
        }

        // Skip the file upload box for now.
        if (type === "file") {
            return;
        }

        // Checkboxes? Only add their value if they're checked.
        if (type === "checkbox" || type === "radio") {
            if (!$this.is(":checked")) {
                return;
            }
        }

        fd.append(name, value);
    });

    return fd;
}
//.webkitGetAsEntry();

function addEventHandler(obj, evt, handler) {
  if (obj.addEventListener) {
    // W3C method
    obj.addEventListener(evt, handler, false);
  } else if (obj.attachEvent) {
    // IE method.
    obj.attachEvent('on' + evt, handler);
  } else {
    // Old school method.
    obj['on' + evt] = handler;
  }
}

function handleFiles(files) {
 var list = document.getElementById('list');
 var my = document.getElementById('file-picker');
        console.log("let me check")
        console.log(my.value)
        for (var i = 0; i < files.length; i++) {
        var file = files[i];
        var reader = new FileReader();

        //attach event handlers here...

        reader.readAsDataURL(file);
        addEventHandler(reader, 'loadend', function(e, file) {
          var bin = this.result;

//          var fileNumber = list.getElementsByTagName('div').length;
//          status.innerHTML = fileNumber < files.length ?
//            'Loaded 100% of file ' + fileNumber + ' of ' + files.length + '...' :
//            'Done loading. processed ' + fileNumber + ' files.';
          var img = document.createElement("img");
          img.className = 'dynamic-images'
          img.file = file;
          img.src = bin;
          img.style.height = '120px';
          img.style.width = '120px';
          img.style.float = "right";
          img.style.border = "3px solid #73AD21";
          img.style.borderRadius = "5px";
          img.hspace = "10";

//          var img = document.createElement('div');
//          img.className = "column";
//          img.innerHTML = '<img id ='+file+' src='+bin+ ' file= ' + file+' alt="Snow" style="display:block;width:120px;height:120px;border:3px solid #73AD21;border-radius:5px;"/>';

          list.appendChild(img);

        }.bindToEventHandler(file));
        PENDING_FILES.push(files[i]);
      }
}
    Function.prototype.bindToEventHandler = function bindToEventHandler() {
      var handler = this;
      var boundParameters = Array.prototype.slice.call(arguments);
      console.log(boundParameters);
      //create closure
      return function(e) {
        e = e || window.event; // get window.event if e argument missing (in IE)
        boundParameters.unshift(e);
        handler.apply(this, boundParameters);
      }
    };

function initDropbox() {
    var $dropbox = $("#dropbox");

    // On drag enter...
    $dropbox.on("dragenter", function(e) {
        e.stopPropagation();
        e.preventDefault();
        $(this).addClass("active");
    });

    // On drag over...
    $dropbox.on("dragover", function(e) {
        e.stopPropagation();
        e.preventDefault();
    });

    // On drop...
    $dropbox.on("drop", function(e) {
        e.preventDefault();
        $(this).removeClass("active");

        // Get the files.
        var files = e.originalEvent.dataTransfer.files;
//        console.log(e.originalEvent.dataTransfer)
        console.log(files);
//        var files = e.target.files;
        handleFiles(files);

        // Update the display to acknowledge the number of pending files.
        $dropbox.text(PENDING_FILES.length + " files ready for yeahh!");
    });

    // If the files are dropped outside of the drop zone, the browser will
    // redirect to show the files in the window. To avoid that we can prevent
    // the 'drop' event on the document.
    function stopDefault(e) {
        e.stopPropagation();
        e.preventDefault();
    }
    $(document).on("dragenter", stopDefault);
    $(document).on("dragover", stopDefault);
    $(document).on("drop", stopDefault);
}