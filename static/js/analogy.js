$(function() {
  var origSize;

  // input of the original image
  function setOriginalImage(url, callback) {
    var uploadImg = new Image();
    uploadImg.onload = function() {
      $('img.original').attr('src', url);
      $('canvas').attr({
        height: uploadImg.height,
        width: uploadImg.width
      });
      $('#old-mask').css({
        marginTop: (-1 * $('img.original').height()) + 'px'
      });
      
      origSize = uploadImg.height;
      var newWidth = Math.round(12 * origSize / $('img.original').height());
      var ctx1 = $('#old-mask')[0].getContext('2d');
      var ctx2 = $('#new-mask')[0].getContext('2d');
      ctx1.strokeStyle = 'red';
      ctx1.lineWidth = newWidth;
      ctx2.strokeStyle = 'red';
      ctx2.lineWidth = newWidth;
      $('.color.red').addClass('highlight');
      
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

  // paint-over palettes from 'voices' app, which was cool
  $('.colorable').map(function(c, colorable) {
    // add the UI to each palette
    var red = $('<li>').append('<span class="color red highlight">_</span>');
    var green = $('<li>').append('<span class="color green">_</span>');
    var blue = $('<li>').append('<span class="color blue">_</span>');
    $(colorable).find('.color-palette').append(red);
    $(colorable).find('.color-palette').append(green);
    $(colorable).find('.color-palette').append(blue);
    
    var colorctx = $(colorable).find('canvas')[0].getContext('2d');
    colorctx.fillStyle = 'red';
    colorctx.strokeStyle = 'red';
    colorctx.lineWidth = 18;
    if (window.devicePixelRatio && window.devicePixelRatio > 1) {
      colorctx.lineWidth = 27;
    }
    
    $(colorable).find('.color').click(function(e) {
      $(colorable).find('.color').removeClass('highlight');
      $(e.currentTarget).addClass('highlight');
      colorctx.strokeStyle = $(e.currentTarget).css('color');
      colorctx.fillStyle = $(e.currentTarget).css('color');
    });
  
    // add painting code here
    var writing = false;
    var lastPt = null;
    var areas = false;
    
    $(colorable).find('canvas').on('mousedown', function() {
      writing = true;
      lastPt = null;
      if (!areas) {
        colorctx.beginPath();
      }
    })
    .on('mouseup mouseout', function() {
      writing = false;
    })
    .on('mousemove', function(e) {
      if (writing && !areas) {
        var newX = Math.round(e.offsetX * origSize / $('img.original').height());
        var newY = Math.round(e.offsetY * origSize / $('img.original').height());
        if (lastPt) {
          colorctx.lineTo(newX, newY);
          colorctx.stroke();
        }
        colorctx.moveTo(newX, newY);
        lastPt = [newX, newY];
      }
    });
  });
  
  $('#copy-masks').click(function() {
    var firstMask = $('#old-mask')[0].toDataURL();
    var img = new Image();
    img.onload = function() {
      $('#new-mask')[0].getContext('2d').drawImage(img, 0, 0);
    };
    img.src = firstMask;
  });

  // offer the test case (no need for custom images)
  $('.test-case').click(function() {
    // download /test-case, paste into canvases
    $('img.original').attr('src', '/img/arch/image.jpg');
    
    setOriginalImage('/img/arch/image.jpg', function() {
      var ctxOld = $('#old-mask')[0].getContext('2d');
      var imgOld = new Image();
      imgOld.onload = function() {
        ctxOld.drawImage(imgOld, 0, 0);
      };
      imgOld.src = '/img/arch/image-mask.jpg';    
      
      var ctxNew = $('#new-mask')[0].getContext('2d');
      var imgNew = new Image();
      imgNew.onload = function() {
        ctxNew.drawImage(imgNew, 0, 0);
      };
      imgNew.src = '/img/arch/image-mask-new.jpg';
    });
    
    // user must click run themselves
  });
  
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
      
      $('input[name="mask"]').val($('#old-mask')[0].toDataURL());
      
      $('input[name="new-mask"]').val($('#new-mask')[0].toDataURL());
      
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
});