var fuse;
var nextQuery = null;
var processing = false;
var currentQuery = null;
var DEBUG = false;
var searchQuery = "";
var pageURL = $(location).attr("href");

var addItem = function(item) {
  item = item.toLowerCase();
  var searchbase = localStorage.getItem("searched")
  if(searchbase) {
    searchbase = searchbase.replace("," + item + ",", ",");
    searchbase = "," + item + searchbase;
    localStorage.setItem("searched", searchbase);
  } else {
    localStorage.setItem("searched", "," + item + ",");
  }

  $("ul.local-storage-list div > a:contains('"+item+"')").each(function() {
       if ($(this).text() === item) {
           $(this).parent().remove();
       }
  })
  $("ul.local-storage-list").prepend("<li><a href='' style='text-align: center'>" + item + "</a><br></li>");
};

$(function() {

  $('#query').focus();

  // populate the left side localStorage list
  // if the localStorage exists, else hide div
  if(localStorage.getItem("searched")) {
    var history = localStorage.getItem("searched");
    $.each(history.split(","), function(index, item) {
      if(item != '') {
        $("ul.local-storage-list").append("<li><a href='' style='text-align: center'>" + item + "</a><br></li>");
      }
    });
    $("ul.local-storage-list").append("<br/><br/>");
  }

  $(document).click(function(e) {
    if (DEBUG) console.log("Clicked somewhere in the doc");
    // figure out if this is a result click
    if(e.target.classList.contains("result-link")) {
      // this is a result link
      var query_value = $("#query").val().trim();
      addItem(query_value);
      $("div.local-storage-div").show();
      if (DEBUG) console.log("Local storage: " + localStorage.getItem("searched"));
    }
  });


  var worker = new Worker('./resources/scripts/worker2.js');
  $.getJSON("data/data.json").success(function(json) {
    worker.postMessage({type: 'data', data: json});

    var search_query = $.url("?") && $.url("?").search;
  
    
    if (search_query) {
      while (search_query[search_query.length-1] == "/"){
        search_query = search_query.slice(0, -1);
      }
      $("#query").val(search_query);
      search();
    }
  })
  .error(function(jqxhr, status, err) {
    if (DEBUG) console.log(jqxhr, status, err);
  });

  $("ul.local-storage-list li a").click(function(e) {
    $("#query").val($(this).text());
    search();
    e.preventDefault();
  });

  worker.onmessage = function(results) {
    processing = false;
    $('.sk-folding-cube').addClass('hidden');
    displayResults(results.data);
    if (nextQuery !== null) {
      var query = nextQuery;
      nextQuery = null;
      search(query);
    }
  }

  function displayResults(results) {
    var html = '';
    for (var i = 0; i < 20; ++i) {
      html += `<a href="`+results[i].Link+`" class="list-group-item list-group-item-action flex-column align-items-start my-1 card" style="padding: 0.1rem">
      <div class="card">
        <div class="card-header bg-primary" >
          <div class="d-inline-flex mx-auto" style="">
            <h4 class="mx-auto" contenteditable="true"><b>`+ results[i].Paper +`</b></h4>
          </div>
        </div>
        <div class="card-body" style="">
          <div class="row">
          <div class="col-md-5">
          <h5><b>Dept :</b> `+ results[i].Department + `<br></h5>
        </div>
            <div class="col-md-5">
              <h5><b>Year : </b>`+ results[i].Semester +`<br><b>Sem :&nbsp;</b>`+ results[i].Year +`<br></h5>
            </div>
           
            <div class="col-md-2">
              <small class="bg-light border text-center badge alert rounded" contenteditable="true">Download link</small></div>
          </div>
        </div>
      </div>
    </a>`
      //'<li><a target="_blank" class="result-link" href="'+results[i].Link+'">' + results[i].Year + ' / ' + results[i].Department + ' / ' + results[i].Semester + ' / ' + results[i].Paper +'</a><li>';
      

    }

    

    $('.result-div').html(html);
    // $('.result-link').click(function() {
    //   ga('send', 'event', 'Result', 'click', $('#query').val().trim());
    // })
  }






  var search = _.debounce(function() {
    //$('.ratings').addClass('hidden');
    var query = $('#query').val().trim();
    if (query === '') {
      $('.result-div').html('    <h4 class="text-center">| Waiting for you to start searching |</h4>');
     
      return;
    }
    if (processing) {
      nextQuery = query;
      return;
    }
    if (query === currentQuery) {
      return;
    }
    processing = true;
    currentQuery = query;
    // $('.sk-folding-cube').removeClass('hidden');
    worker.postMessage({type: 'query', query: query});

  }, 200);

  $('#query').keydown(search);

  // function to update the query url
  $('#query').keyup(function () {

    searchQuery = $('#query').val().trim();
    window.history.replaceState(null, null, "?search="+searchQuery)
  });
});
