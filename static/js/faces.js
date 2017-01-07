$(function() {
  var origSize;

  // input of the original image
  function setOriginalImage(url, callback) {
    var uploadImg = new Image();
    uploadImg.onload = function() {
      $('img.original').attr('src', url);
      
      if (callback && typeof callback === 'function') {
        callback();
      }
    };
    uploadImg.src = url;
  }
  
  $('.submit-original[type="file"]').on('change', function() {
    // grab file directly, without need to upload
    var image = this.files[0];
    if (image) {
      setOriginalImage(URL.createObjectURL(image));
    }
  });
  
  /* TODO: images from cross-origin URLs
  $('.submit-original[type="text"]').on('change', function(e) {
    // image on remote website
    $('img.original').attr('src', e.target.value);
  });
  */
  
  // if everything goes well, user clicks this to start
  $('button.run').click(composeAndSubmitForm);
  
  var submitting = false;
  function composeAndSubmitForm() {
    if (submitting) {
      return;
    }
    submitting = true;
    setTimeout(function() {
      submitting = false;
    }, 4000);
    
    var originalImage = $('img.original').attr('src');
    var origImg = new Image();
    origImg.onload = function() {
      if (originalImage.indexOf('data:image') === 0) {
        $('input[name="original"]').val(originalImage);
      } else {
        var canv = $('<canvas>').attr({
          width: origImg.width,
          height: origImg.height
        })[0]
        canv.getContext('2d').drawImage(origImg, 0, 0);
        $('input[name="original"]').val(canv.toDataURL());
      }
      
      $('form').submit();
    };
    origImg.src = originalImage;
  }
  
  
  function processDroppedImage (e) {
    setOriginalImage(e.target.result);
  }

  function watchForDroppedImage() {
    var blockHandler = function (e) {
      e.stopPropagation();
      e.preventDefault();
    };

    // file drop handlers
    var dropFile = function (e) {
      e.stopPropagation();
      e.preventDefault();
      files = e.dataTransfer.files;
      if (files && files.length) {
        var reader = new FileReader();
        var fileType = files[0].type.toLowerCase();
        if(fileType.indexOf("image") > -1){
          // process an image
          reader.onload = processDroppedImage;
          reader.readAsDataURL(files[0]);
        }
      }
    };

    window.addEventListener('dragenter', blockHandler, false);
    window.addEventListener('dragexit', blockHandler, false);
    window.addEventListener('dragover', blockHandler, false);
    window.addEventListener('drop', dropFile, false);
  }
  watchForDroppedImage();
  
  // Photobooth too
  $('#photobooth').css({
    height: Math.round(0.75 * $('#photobooth').width())
  });
  
  function toggleCamera () {
    $('#photobooth').off().text('').photobooth().click(function() {
      var camctx = $("#photobooth canvas")[0].toDataURL();
      $('img.original').attr('src', camctx);
      $('#photobooth').off().text('Click for new photo').click(toggleCamera);
    });
  }
  $('#photobooth').click(toggleCamera);
});