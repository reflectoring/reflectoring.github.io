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
      let cookie = getCookie("launchdarkly");
      if(cookie == null){

        $.fn.cornerpopup({
          delay: 30000,
          width: "600px",
          height: "300px",
          variant: 10,
          slide: 1,
          position: "left",
          content: "<a href=\"https://launchdarkly.com/?utm_source=reflectoring&utm_medium=display&utm_campaign=aodm&utm_content=ebook_oreilly_efm\"><img width=\"600\" alt=\"State of Feature Management\" src=\"/images/launchdarkly/2021_7_best_practice_short-term_and_permanent_feature_flags_Ad_1200x1200 (2).png\"/></a>",
          afterPopup: function() {
            setCookie("launchdarkly", "true", 7);
          }
        });

      }
    }

    showAdPopup();

});
