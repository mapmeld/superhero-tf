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
    $('form').submit();
  });
});