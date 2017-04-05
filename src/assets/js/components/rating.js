var $$ = require('domtastic');

var ratingBox = $$('.visitor-rating .star-rating');
var ratingPassive = $$('.rating-passive');

if (ratingBox.length) {
  
  var ratingElement =
    '<span class="stars">' +
    '<i class="fa fa-star s1" data-score="1"></i>' +
    '<i class="fa fa-star s2" data-score="2"></i>' +
    '<i class="fa fa-star s3" data-score="3"></i>' +
    '<i class="fa fa-star s4" data-score="4"></i>' +
    '<i class="fa fa-star s5" data-score="5"></i>' +
    '<i class="fa fa-star s6" data-score="6"></i>' +
    '<i class="fa fa-star s7" data-score="7"></i>' +
    '<i class="fa fa-star s8" data-score="8"></i>' +
    '<i class="fa fa-star s9" data-score="9"></i>' +
    '<i class="fa fa-star s10" data-score="10"></i>' +
    '</span>';
  
  ratingBox.forEach(function (element) {
    var _this = $$(element);
    _this.append(ratingElement);
    if (_this.hasClass('active')) {
      var dataName = _this.attr('data-name');
      _this.append('<input readonly hidden="" name="score_' + dataName + '" id="score_' + dataName + '">');
    }
    var rating = _this.attr('data-rating');
    for (var e = 0; e < rating; e++) {
      var rate = e + 1;
      _this.children('.stars').children('.s' + rate).addClass('active');
    }
  });
  var ratingActive = $$('.star-rating.active i');
  
  ratingActive.on('mouseover mouseout', function (e) {
    e.preventDefault();
    var _this = $$(this);
    var dataScore = _this.attr('data-score');
    for (var i = 0; i < dataScore; i++) {
      var a = i + 1;
      _this.parent().children('.s' + a).toggleClass('hover');
    }
  }).on('click', function (e) {
    e.preventDefault();
    var _this = $$(this);
    var dataScore = _this.attr('data-score');
    var input = _this.closest('.star-rating').find("input").val(dataScore);
    _this.parent().children('.fa').removeClass('active');
    for (var i = 0; i < dataScore; i++) {
      var a = i + 1;
      _this.parent().children('.s' + a).addClass('active');
    }
    return false;
  });
}

if (ratingPassive.length){
  ratingPassive.forEach(function (item) {
    var _this = $$(item);
    var stars = _this.find(".stars");
    for (var i = 0; i < 5; i++) {
      if (i < _this.attr("data-rating")) {
        stars.append("<figure class='active fa fa-star'></figure>")
      }
      else {
        stars.append("<figure class='fa fa-star'></figure>")
      }
    }
  });
  
}