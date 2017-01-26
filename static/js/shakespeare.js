if (typeof console === 'undefined') {
  console = {
    log: function() { }
  };
}

$(function() {
  $.get('/txt/shakespeare.txt', function(data) {
    if (!$('textarea').val().trim().length) {
      $('textarea').val(data);
      $('input[name="source"]').val(data);
    }
  });
  
  $('textarea').on('change input', function() {
    $('input[name="source"]').val($('textarea').val());
  });
  
  $('button.run').click(function() {
    var postal = {};
    var ips = $('.experiment-values input');
    for (var i = 0; i < ips.length; i++) {
      postal[$(ips[i]).attr('name')] = $(ips[i]).val();
    }
    $.post('/spawn', postal, function(data) {
      console.log(data);
      if (data._id) {
        window.location.href = '/results/' + data._id;
      }
    });
  });
});