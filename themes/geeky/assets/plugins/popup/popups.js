$( document ).ready(function() {

    function getCookie(name) {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
    }

    function setCookie(name, value, days) {
        var expires = "";
        if (days) {
            var date = new Date();
            date.setTime(date.getTime() + (days*24*60*60*1000));
            expires = "; expires=" + date.toUTCString();
        }
        document.cookie = name + "=" + (value || "")  + expires + "; path=/";
    }

    function showAdPopup(){
      let cookie = getCookie("reflectoring-popup");
      if(cookie == null){

        $.fn.cornerpopup({
          delay: 30000,
          width: "1100px",
          height: "600px",
          variant: 10,
          slide: 1,
          position: "left",
          content: "<a href=\"https://height.app/?home=&utm_source=ReflectoringsimplifyjanNewsletter&utm_medium=ReflectoringsimplifyjanNewsletter&utm_campaign=ReflectoringsimplifyjanNewslette\" target=\"blank\"><img width=\"1100\" alt=\"Height\" src=\"/images/height/height-horizontal-orig.png\"/></a>",
          afterPopup: function() {
            setCookie("reflectoring-popup", "true", 7);
          }
        });

      }
    }

    showAdPopup();

});
