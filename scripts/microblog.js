function loadPostList(elDiv, elTemplate) {
      $(elDiv).empty();
      $(elDiv).append('<center><p>Loading post list...</p><img src="/images/spinner.gif" alt="" /></center>');
      $.getJSON("/cgi/out/list.posts.json", function(data) {
          if(data.status == "true") {
              $(elDiv).empty();
              $(elTemplate).tmpl(data.data).appendTo(elDiv);
              bindDeletePost('.aDeletePost');
              //bindResetUser('.aResetUser');
              //bindEditUser('.aEditUser');
              //ajaxFormEditUser('.frmEditUser');
          } else {
              $(elDiv).append("<p>Error retrieving JSON data: [" + data.description + "]</p>");
          }
      });

      return(true);
}

function bindDeletePost(elDeleteLink) {
    $(elDeleteLink).click(function() {
        var postId = $(this).attr("data-id");
        var postTitle = $(this).parent().parent().attr("data-title");
        if( confirm("Do you really want to delete '" + postTitle + "'?") == false ) return false;
        $('#divPostList ul li#' + postId).css({"text-decoration":"line-through"});
        $.getJSON("/cgi/in/delete.post?postId="+postId, function(data) {
            showMessage( data.description, data.status, 7 );
            if(data.status == "true") {
                loadPostList('#divPostList', '#microblog-template');
            }
        });
    });

    return(true);
}

function getShortTitle(contentString) {
    cleanContent = contentString.replace(/\W/g, '');
    shortContent = cleanContent.substring(0, 20);

    return(shortContent);
}

function showEnclosures() {
	$('#divEnclosures').show();
}

$(document).ready( function() {
		var linkExtraction = true;

        	$('.aDeletePost').click(function() {
                	var aobj = $(this);
                	var delurl = aobj.attr("href");
                	var rowid = aobj.parent().attr("id");
                	var title = aobj.parent().attr("data-title");
                	if(confirm("Delete " + title + "?") == false) {
                        	return false;
                	} else {
                        	$.ajax({
                                	url: delurl,
                                	type: "GET",
                                	dataType:       'json',
                                	success:        function(data) {
                                        	if(data.status == "false") {
			                                showMessage( data.description, data.status, 5 );
                                        	} else {
                                                	$('#'+rowid).remove();
                                        	}
						<?if($device=="android") {?>alert("Post deleted.");<?}?>
						loadPostList();
                                	}
                        	});
                	}
                	return false;
        	});

		$('#btnAttachFile').bind('click', function() {
			$('#divUpload').show();
		});

		$('#aUploadTrigger').bind('click', function() {
			$('#divEnclosures').show();
			$('#file_upload').uploadifive('upload');
		});

		//Set up the twitter check-box, img interaction
	        $('#imgTweet').bind('click', function() {
        	        $('#chkTweet').prop("checked", !$('#chkTweet').prop("checked"));
                	$('#imgTweet').toggleClass('icon-twitter');
	                $('#imgTweet').toggleClass('icon-notwitter');
        	});
		if( $('#chkTweet').is(":checked") ) {
               		$('#imgTweet').removeClass('icon-notwitter').addClass('icon-twitter');
		} else {
	               	$('#imgTweet').removeClass('icon-twitter').addClass('icon-notwitter');
		}
	        $('#chkTweet').bind('change', function() {
                	$('#imgTweet').toggleClass('icon-twitter');
	                $('#imgTweet').toggleClass('icon-notwitter');
        	});


                $('#frmBlogPost').ajaxForm({
                        <?if($device=="android") {?>dataType:       'html',<?
                        } else {?>dataType:       'json',<?}?>
			cache:		false,
                        clearForm:	true,
			resetForm:	true,
			timeout:	30000,
                        beforeSubmit:   function() {
                                $('#imgSpinner').show();
                                $('#btnSubmit').attr("disabled", true);
                        },
                        success:        function(data) {
                                if(data.status == "false") {
	                                showMessage( data.description, data.status, 5 );
                                } else {
					<?if($device=="android") {?>alert('Post successful.');<?}?>
					$('#txtContent').val('');
                                        $('#txtLink').val('');
					$('#divRtSource').empty();
					$('#divExtEnclosures').empty();
				        <?if($prefs['mbreturnhome'] == 1) {?>
					window.location = '<?echo $startpage?>';
                                        <?} else {?>
			                loadPostList('#divPostList', '#microblog-template');
					<?}?>
                                }
                                $('#imgSpinner').hide();
                                $('#btnSubmit').attr("disabled", false);
				$('#spnCharCount').text( <?echo $default_blog_post_max_chars?> - $('#txtContent').val().length );
                        },
			error:		function(x, t, m) {
				showMessage( "Error: " + m + "(" + t + ")", false, 60 );
		                loadPostList('#divPostList', '#microblog-template');
			}
                });

		//Set up some paste handling to catch pasted links
		$('#txtContent').bind('paste', function() {
                        //Is there a link in this content?
                        if(linkExtraction == true) {
				setTimeout(function() {
                                var linkStart = $('#txtContent').val().indexOf('http');
                                if( (linkStart > -1) ) {
                                        $('#txtLink').val( trim($('#txtContent').val().substr(linkStart)) );
                                        $('#divLink').show();
                                        linkExtraction = false;
                                }
				}, 100);
                        }
		});


		//Set up a character count tracker for the post content box
		$('#txtContent').bind('keyup', function () {
                        var contlen = $('#txtContent').val().length;
                        var tweetlen = 138;

			//Is there a link in this content?
			if(linkExtraction == true) {
				var linkStart = $('#txtContent').val().indexOf('http');
        	                var linkEnd = $('#txtContent').val().indexOf(' ', linkStart);
				if( (linkStart > -1) && (linkEnd > linkStart) ) {
					$('#txtLink').val( $('#txtContent').val().substr(linkStart,(linkEnd - linkStart)) );
					$('#divLink').show();
					linkExtraction = false;
				}
			}

			//Test and set
			$('#spnCharCount').text( contlen );
                        if( contlen > 64000 ) {
				$('#spnCharCount').addClass('msgbad');
				$('#divBlogPost #btnSubmit').addClass('btn-danger');
				$('#divBlogPost #btnSubmit').addClass('disabled');
				$('#divBlogPost #btnSubmit').val('Too long!');
				$('#spnTweetWarning').show();
                        <?if( twitter_is_enabled($uid) ) {?>
			} else if ( (contlen > tweetlen) && $('#chkTweet').is(':checked') ) {
				$('#spnCharCount').addClass('msgwarn');
				$('#spnTweetWarning').show();
			<?}?>
			} else {
				$('#spnCharCount').removeClass('msgbad');
				$('#spnCharCount').removeClass('msgwarn');
				$('#divBlogPost #btnSubmit').removeClass('btn-danger');
				$('#divBlogPost #btnSubmit').removeClass('disabled');
				$('#divBlogPost #btnSubmit').val('Post It!');
				$('#spnTweetWarning').hide();
			}
		});

		$('#spnCharCount').text( $('#txtContent').val().length );

	        //Populate the user management section
	        loadPostList('#divPostList', '#microblog-template');

		//If there's already a link, don't enable link extraction
		if( $('#txtLink').val() != '') {
			linkExtraction = false;
		}
});
