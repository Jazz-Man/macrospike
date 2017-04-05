$(document).ready($ => {
  function changeCaptchaImage(reloadImage) {
    if (!wpdiscuzRecaptcha && (!isGoodbyeCaptchaActive && (isShowCaptchaForGuests || isShowCaptchaForMembers))) {
      const form = reloadImage.parents(".wc-form-wrapper");
      const keyField = $(".wpdiscuz-cnonce", form);
      if (isCaptchaInSession) {
        const uuId = getUUID();
        const captchaImg = $(reloadImage).prev().children(".wc_captcha_img");
        const src$$0 = captchaImg.attr("src");
        const fileUrl = src$$0.substring(0, src$$0.indexOf("=") + 1);
        captchaImg.attr("src", `${fileUrl + uuId}&r=${Math.random()}`);
        keyField.attr("id", uuId);
        keyField.attr("value", uuId);
      } else {
        const data = new FormData;
        data.append("action", "generateCaptcha");
        const isMain = form.hasClass("wc-secondary-form-wrapper") ? 0 : 1;
        const uniqueId = getUniqueID(reloadImage, isMain);
        data.append("wpdiscuz_unique_id", uniqueId);
        const ajaxObject = getAjaxObj(data);
        ajaxObject.done(response => {
          try {
            const obj = $.parseJSON(response);
            if (obj.code == 1) {
              const captchaImg = $(reloadImage).prev().children(".wc_captcha_img");
              const src = captchaImg.attr("src");
              const lastSlashIndex = src.lastIndexOf("/") + 1;
              const newSrc = src.substring(0, lastSlashIndex) + obj.message;
              captchaImg.attr("src", newSrc);
              keyField.attr("id", obj.key);
              keyField.attr("value", obj.key);
            }
          } catch (e) {
            console.log(e);
          }
          $(".wpdiscuz-loading-bar").hide();
        });
      }
    }
  }
  function getUUID() {
    const chars = "123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let uuId = "c";
    i = 0;
    for (;i < 13;i++) {
      uuId += chars[Math.floor(Math.random() * (chars.length - 1) + 1)];
    }
    return uuId;
  }
  
  function notifySubscribers(obj) {
    if (!obj.held_moderate) {
      const data = new FormData;
      data.append("action", "checkNotificationType");
      data.append("comment_id", obj.new_comment_id);
      data.append("email", obj.user_email);
      data.append("isParent", obj.is_main);
      const ajaxObject = getAjaxObj(data);
      ajaxObject.done(response => {
        try {
          obj = $.parseJSON(response);
        } catch (e) {
          console.log(e);
        }
      });
    }
  }
  function wpdiscuzRedirect(obj) {
    if (obj.redirect > 0 && obj.new_comment_id) {
      const data = new FormData;
      data.append("action", "redirect");
      data.append("commentId", obj.new_comment_id);
      const ajaxObject = getAjaxObj(data);
      ajaxObject.done(response => {
        obj = $.parseJSON(response);
        if (obj.code == 1) {
          setTimeout(() => {
            window.location.href = obj.redirect_to;
          }, 5E3);
        }
      });
    }
  }
  function setCookieInForm() {
    if ($.cookie("wc_author_name") && !$.cookie("wc_author_name").includes("Anonymous")) {
      $(".wc_comm_form .wc_name").val($.cookie("wc_author_name"));
    }
    if ($.cookie("wc_author_email") && !$.cookie("wc_author_email").includes("@example.com")) {
      $(".wc_comm_form .wc_email").val($.cookie("wc_author_email"));
    }
    if ($.cookie("wc_author_website")) {
      $(".wc_comm_form .wc_website").val($.cookie("wc_author_website"));
    }
  }
  function addCookie(wcForm, obj) {
    let email = "";
    let name = "";
    if ($(".wc_email", wcForm).val()) {
      email = $(".wc_email", wcForm).val();
    } else {
      email = obj.user_email;
    }
    if ($(".wc_name", wcForm).val()) {
      name = $(".wc_name", wcForm).val();
    } else {
      name = obj.user_name;
    }
    if (storeCommenterData == null) {
      $.cookie("wc_author_email", email);
      $.cookie("wc_author_name", name);
      $.cookie("wc_author_website", $(".wc_website", wcForm).val());
    } else {
      storeCommenterData = parseInt(storeCommenterData);
      $.cookie("wc_author_email", email, {
        expires : storeCommenterData,
        path : "/"
      });
      $.cookie("wc_author_name", name, {
        expires : storeCommenterData,
        path : "/"
      });
      $.cookie("wc_author_website", $(".wc_website", wcForm).val(), {
        expires : storeCommenterData,
        path : "/"
      });
    }
  }
  function wcCancelOrSave(uniqueID, content) {
    $(`#wc-comm-${uniqueID} > .wc-comment-right .wc-comment-footer .wc_editable_comment`).show();
    $(`#wc-comm-${uniqueID} > .wc-comment-right .wc-comment-footer .wc_cancel_edit`).hide();
    $(`#wc-comm-${uniqueID} #wpdiscuz-edit-form`).replaceWith(content);
  }
  function nl2br(str, is_xhtml) {
    const breakTag = is_xhtml || typeof is_xhtml === "undefined" ? "<br/>" : "<br>";
    const string = (`${str}`).replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, `$1${breakTag}$2`);
    return string.replace("<br><br>", "<br/>");
  }
  function wpdiscuzLoadComments(loadButton, loaded, loading) {
    loadButton.toggleClass(loaded);
    loadButton.toggleClass(loading);
    const data = new FormData;
    console.log(data);
    data.append("action", "loadMoreComments");
    data.append("offset", wpdiscuzLoadCount);
    data.append("orderBy", wpdiscuzCommentOrderBy);
    data.append("order", wpdiscuzCommentOrder);
    data.append("lastParentId", getLastParentID());
    wpdiscuzLoadCount++;
    getAjaxObj(data).done(response => {
      try {
        const obj = $.parseJSON(response);
        $(".wpdiscuz-comment-pagination").before(obj.comment_list);
        setLoadMoreVisibility(obj);
        $(".wpdiscuz_single").remove();
        isRun = false;
        displayShowHideReplies();
      } catch (e) {
        console.log(e);
      }
      $(".wpdiscuz-loading-bar").hide();
      $(".wc-load-more-submit").blur();
      loadButton.toggleClass(loaded);
      loadButton.toggleClass(loading);
    });
  }
  function setLoadMoreVisibility(obj) {
    let hasMoreComments = 0;
    if (obj.is_show_load_more == false) {
      hasMoreComments = 0;
      wpdiscuzHasMoreComments = 0;
      $(".wc-load-more-submit").parents(".wpdiscuz-comment-pagination").hide();
    } else {
      setLastParentID(obj.last_parent_id);
      wpdiscuzHasMoreComments = 1;
      hasMoreComments = 1;
    }
    $("#wpdiscuzHasMoreComments").val(hasMoreComments);
  }
  function setActiveButton(clickedBtn) {
    $(".wpdiscuz-sort-buttons .wpdiscuz-sort-button").each(function() {
      $(this).removeClass("wpdiscuz-sort-button-active");
    });
    clickedBtn.addClass("wpdiscuz-sort-button-active");
  }
  function getSingleComment() {
    const loc = location.href;
    const matches = loc.match(/#comment\-(\d+)/);
    if (matches !== null) {
      const commentId = matches[1];
      if (!$(`#comment-${commentId}`).length) {
        const data = new FormData;
        data.append("action", "getSingleComment");
        data.append("commentId", commentId);
        const ajaxObject = getAjaxObj(data);
        ajaxObject.done(response => {
          try {
            const obj = $.parseJSON(response);
            $(".wc-thread-wrapper").prepend(obj.message);
            $("html, body").animate({
              scrollTop : $(".wc-thread-wrapper").offset().top
            }, 1E3);
          } catch (e) {
            console.log(e);
          }
          $(".wpdiscuz-loading-bar").hide();
        });
      }
    }
  }
  function liveUpdate() {
    const visibleCommentIds = getVisibleCommentIds();
    const email = $.cookie("wc_author_email") != undefined && $.cookie("wc_author_email") != "" ? $.cookie("wc_author_email") : "";
    const data = new FormData;
    data.append("action", "updateAutomatically");
    data.append("loadLastCommentId", loadLastCommentId);
    data.append("visibleCommentIds", visibleCommentIds);
    data.append("email", email);
    const ajaxObject = getAjaxObj(data);
    ajaxObject.done(response => {
      try {
        const obj = $.parseJSON(response);
        if (obj.code == 1) {
          if (commentListUpdateType == 1) {
            liveUpdateImmediately(obj);
          } else {
            wpdiscuzCommentArray = wpdiscuzCommentArray.concat(obj.message.comments);
            wpdiscuzReplyArray = wpdiscuzReplyArray.concat(obj.message.author_replies);
            const newCommentArrayLength = wpdiscuzCommentArray.length;
            const newRepliesArrayLength = wpdiscuzReplyArray.length;
            if (newCommentArrayLength > 0) {
              let newCommentText = `${newCommentArrayLength} `;
              newCommentText += newCommentArrayLength > 1 ? wpdiscuzAjaxObj.wpdiscuz_options.wc_new_comments_button_text : wpdiscuzAjaxObj.wpdiscuz_options.wc_new_comment_button_text;
              $(".wc_new_comment").html(newCommentText).show();
            } else {
              $(".wc_new_comment").hide();
            }
            if (newRepliesArrayLength > 0) {
              let newReplyText = `${newRepliesArrayLength} `;
              newReplyText += newRepliesArrayLength > 1 ? wpdiscuzAjaxObj.wpdiscuz_options.wc_new_replies_button_text : wpdiscuzAjaxObj.wpdiscuz_options.wc_new_reply_button_text;
              $(".wc_new_reply").html(newReplyText).show();
            } else {
              $(".wc_new_reply").hide();
            }
          }
          $(".wc_header_text_count").html(obj.wc_all_comments_count_new);
          loadLastCommentId = obj.loadLastCommentId;
        }
      } catch (e) {
        console.log(e);
      }
      $(".wpdiscuz-loading-bar").hide();
    });
  }
  function liveUpdateImmediately(obj) {
    if (obj.message !== undefined) {
      let commentObject;
      const message = obj.message;
      let i = 0;
      for (;i < message.length;i++) {
        commentObject = message[i];
        addCommentToTree(commentObject.comment_parent, commentObject.comment_html);
      }
      displayShowHideReplies();
    }
  }
  function cloneSecondaryForm(field) {
    const uniqueId = getUniqueID(field, 0);
    $(`#wpdiscuz_form_anchor-${uniqueId}`).before(replaceUniqueId(uniqueId));
    const secondaryFormWrapper = $(`#wc-secondary-form-wrapper-${uniqueId}`);
    wpdiscuzReplaceValidationUI($(".wc_comm_form", secondaryFormWrapper)[0]);
    secondaryFormWrapper.slideToggle(700, () => {
      field.addClass("wpdiscuz-clonned");
    });
    changeCaptchaImage($(".wc_captcha_refresh_img", secondaryFormWrapper));
  }
  function replaceUniqueId(uniqueId) {
    const secondaryForm = $("#wpdiscuz_hidden_secondary_form").html();
    return secondaryForm.replace(/wpdiscuzuniqueid/g, uniqueId);
  }
  function getUniqueID(field, isMain) {
    let fieldID = "";
    if (isMain) {
      fieldID = field.parents(".wc-main-form-wrapper").attr("id");
    } else {
      fieldID = field.parents(".wc-comment").attr("id");
    }
    const uniqueID = fieldID.substring(fieldID.lastIndexOf("-") + 1);
    return uniqueID;
  }
  function getCommentID(uniqueID) {
    return uniqueID.substring(0, uniqueID.indexOf("_"));
  }
  function getLastParentID() {
    const url = $(".wc-load-more-link").attr("href");
    return url.substring(url.lastIndexOf("=") + 1);
  }
  function setLastParentID(lastParentID) {
    const url = $(".wc-load-more-link").attr("href");
    $(".wc-load-more-link").attr("href", url.replace(/[\d]+$/m, lastParentID));
    if (commentListLoadType != 2) {
      $(".wpdiscuz-comment-pagination").show();
    }
  }
  function getCommentDepth(field) {
    const fieldClasses = field.attr("class");
    const classesArray = fieldClasses.split(" ");
    let depth = "";
    $.each(classesArray, (index, value) => {
      if ("wc_comment_level" === getParentDepth(value, false)) {
        depth = getParentDepth(value, true);
      }
    });
    return parseInt(depth) + 1;
  }
  function getParentDepth(depthValue, isNumberPart) {
    let depth = "";
    if (isNumberPart) {
      depth = depthValue.substring(depthValue.indexOf("-") + 1);
    } else {
      depth = depthValue.substring(0, depthValue.indexOf("-"));
    }
    return depth;
  }
  function addCommentToTree(parentId, comment) {
    if (parentId == 0) {
      $(".wc-thread-wrapper").prepend(comment);
    } else {
      const parentUniqueId = getUniqueID($(`#comment-${parentId}`), 0);
      $(`#wpdiscuz_form_anchor-${parentUniqueId}`).after(comment);
    }
  }
  function getVisibleCommentIds() {
    let uniqueId;
    let commentId;
    let visibleCommentIds = "";
    $(".wc-comment-right").each(function() {
      uniqueId = getUniqueID($(this), 0);
      commentId = getCommentID(uniqueId);
      visibleCommentIds += `${commentId},`;
    });
    return visibleCommentIds;
  }
  function loginButtonsClone() {
    if ($(".wc_social_plugin_wrapper .wp-social-login-provider-list").length) {
      $(".wc_social_plugin_wrapper .wp-social-login-provider-list").clone().prependTo("#wpdiscuz_hidden_secondary_form > .wc-form-wrapper >  .wc-secondary-forms-social-content");
    } else {
      if ($(".wc_social_plugin_wrapper .the_champ_login_container").length) {
        $(".wc_social_plugin_wrapper .the_champ_login_container").clone().prependTo("#wpdiscuz_hidden_secondary_form > .wc-form-wrapper >  .wc-secondary-forms-social-content");
      } else {
        if ($(".wc_social_plugin_wrapper .social_connect_form").length) {
          $(".wc_social_plugin_wrapper .social_connect_form").clone().prependTo("#wpdiscuz_hidden_secondary_form > .wc-form-wrapper >  .wc-secondary-forms-social-content");
        } else {
          if ($(".wc_social_plugin_wrapper .oneall_social_login_providers").length) {
            $(".wc_social_plugin_wrapper .oneall_social_login .oneall_social_login_providers").clone().prependTo("#wpdiscuz_hidden_secondary_form > .wc-form-wrapper >  .wc-secondary-forms-social-content");
          }
        }
      }
    }
  }
  function displayShowHideReplies() {
    $("#wcThreadWrapper .wc-comment").each(function(i) {
      if ($("> .wc-reply", this).length) {
        $("> .wc-comment-right .wc-comment-footer .wc-toggle", this).removeClass("wpdiscuz-hidden");
      }
    });
  }
  function getAjaxObj(data) {
    if (data.action !== "liveUpdate") {
      $(".wpdiscuz-loading-bar").show();
    }
    data.append("postId", wpdiscuzPostId);
    return $.ajax({
      type : "POST",
      url : wpdiscuzAjaxObj.url,
      data,
      contentType : false,
      processData : false
    });
  }
  function wpdiscuzReset() {
    $(".wpdiscuz_reset").val("");
  }
  function setTextareaCharCount(elem, count) {
    if (commentTextMaxLength != null) {
      const currLength = elem.val().length;
      const textareaWrap = elem.parents(".wc_comm_form");
      const charCountDiv = $(".commentTextMaxLength", textareaWrap);
      const left = commentTextMaxLength - currLength;
      if (left <= 10) {
        charCountDiv.addClass("left10");
      } else {
        charCountDiv.removeClass("left10");
      }
      charCountDiv.html(left);
    }
  }
  function wpdValidateFieldRequired(form) {
    const fieldsGroup = form.find(".wpd-required-group");
    $.each(fieldsGroup, function() {
      $("input", this).removeAttr("required");
      const checkedFields = $("input:checked", this);
      if (checkedFields.length === 0) {
        $("input", $(this)).attr("required", "required");
      } else {
        $(".wpd-field-invalid", this).remove();
      }
    });
    if (wpdiscuzRecaptcha && ($("input[name=wpdiscuz_recaptcha]", form).length && !$("input[name=wpdiscuz_recaptcha]", form).val().length)) {
      wpdGoogleRecaptchaValid = false;
      $(".wpdiscuz-recaptcha", form).css("border", "1px solid red");
    } else {
      if (wpdiscuzRecaptcha) {
        $(".wpdiscuz-recaptcha", form).css("border", "none");
      }
    }
  }
  function wpdiscuzReplaceValidationUI(form) {
    form.addEventListener("invalid", event => {
      event.preventDefault();
    }, true);
    form.addEventListener("submit", function(event) {
      if (!this.checkValidity()) {
        event.preventDefault();
      }
    });
  }
  function wpdiscuzRemoveError(field) {
    const wpdiscuzErrorDiv = $(field).parents("div.wpdiscuz-item").find(".wpd-field-invalid");
    if (wpdiscuzErrorDiv) {
      wpdiscuzErrorDiv.remove();
    }
  }
  const isUserLoggedIn = wpdiscuzAjaxObj.wpdiscuz_options.is_user_logged_in;
  var isShowCaptchaForGuests = wpdiscuzAjaxObj.wpdiscuz_options.wc_captcha_show_for_guest == 1 && !isUserLoggedIn;
  var isShowCaptchaForMembers = wpdiscuzAjaxObj.wpdiscuz_options.wc_captcha_show_for_members == 1 && isUserLoggedIn;
  var isCaptchaInSession = wpdiscuzAjaxObj.wpdiscuz_options.isCaptchaInSession;
  var wpdiscuzRecaptcha = wpdiscuzAjaxObj.wpdiscuz_options.wpDiscuzReCaptcha;
  var isGoodbyeCaptchaActive = wpdiscuzAjaxObj.wpdiscuz_options.isGoodbyeCaptchaActive;
  var commentListLoadType = wpdiscuzAjaxObj.wpdiscuz_options.commentListLoadType;
  const wordpressIsPaginate = wpdiscuzAjaxObj.wpdiscuz_options.wordpressIsPaginate;
  var wpdiscuzPostId = wpdiscuzAjaxObj.wpdiscuz_options.wc_post_id;
  var commentListUpdateType = wpdiscuzAjaxObj.wpdiscuz_options.commentListUpdateType;
  const commentListUpdateTimer = wpdiscuzAjaxObj.wpdiscuz_options.commentListUpdateTimer;
  const disableGuestsLiveUpdate = wpdiscuzAjaxObj.wpdiscuz_options.liveUpdateGuests;
  var loadLastCommentId = wpdiscuzAjaxObj.wpdiscuz_options.loadLastCommentId;
  var wpdiscuzCommentOrder = wpdiscuzAjaxObj.wpdiscuz_options.wordpress_comment_order;
  const commentsVoteOrder = wpdiscuzAjaxObj.wpdiscuz_options.commentsVoteOrder;
  var storeCommenterData = wpdiscuzAjaxObj.wpdiscuz_options.storeCommenterData;
  var wpdiscuzLoadCount = 1;
  var wpdiscuzCommentOrderBy = "comment_date_gmt";
  var wpdiscuzReplyArray = [];
  var wpdiscuzCommentArray = [];
  const wpdiscuzUploader = wpdiscuzAjaxObj.wpdiscuz_options.uploader;
  var commentTextMaxLength = wpdiscuzAjaxObj.wpdiscuz_options.commentTextMaxLength;
  var wpdGoogleRecaptchaValid = true;
  let wpdiscuzReplyButton = "";
  loginButtonsClone();
  displayShowHideReplies();
  if (commentsVoteOrder) {
    $(".wpdiscuz-vote-sort-up").addClass("wpdiscuz-sort-button-active");
    wpdiscuzCommentOrderBy = "by_vote";
  } else {
    $(`.wpdiscuz-date-sort-${wpdiscuzCommentOrder}`).addClass("wpdiscuz-sort-button-active");
  }
  $("#wc_unsubscribe_message").delay(4E3).fadeOut(1500, function() {
    $(this).remove();
    location.href = location.href.substring(0, location.href.indexOf("subscribeAnchor") - 1);
  });
  if ($(".wc_main_comm_form").length) {
    setCookieInForm();
    wpdiscuzReplaceValidationUI($(".wc_main_comm_form")[0]);
  }
  $(document).delegate(".wc-reply-button", "click", function() {
    wpdiscuzReplyButton = $(this);
    if ($(this).hasClass("wpdiscuz-clonned")) {
      $(`#wc-secondary-form-wrapper-${getUniqueID($(this), 0)}`).slideToggle(700);
    } else {
      cloneSecondaryForm($(this));
    }
    $(this).toggleClass("wc-cta-active");
    setCookieInForm();
  });
  $(document).delegate(".wc-comment-img-link", "click", function() {
    $(this).parents(".wc-comment-img-link-wrap").find("span").toggleClass("wc-comment-img-link-show");
  });
  $(document).delegate("textarea.wc_comment", "focus", function() {
    const parent = $(this).parents(".wc-form-wrapper");
    $(".commentTextMaxLength", parent).show();
    $(".wc-form-footer", parent).slideDown(700);
  });
  $(document).delegate("#wpcomm textarea", "focus", function() {
    if (!$(this).next(".autogrow-textarea-mirror").length) {
      $(this).autoGrow();
    }
  });
  $(document).delegate("textarea.wc_comment", "blur", function() {
    const parent = $(this).parents(".wc-form-wrapper");
    $(".commentTextMaxLength", parent).hide();
  });
  $(document).delegate("textarea.wc_comment", "keyup", function() {
    setTextareaCharCount($(this), commentTextMaxLength);
  });
  $.each($("textarea.wc_comment"), function() {
    setTextareaCharCount($(this), commentTextMaxLength);
  });
  $(document).delegate(".wc-share-link", "click", function() {
    const parent = $(this).parents(".wc-comment-right");
    $(".share_buttons_box", parent).slideToggle(1E3);
    $(this).toggleClass("wc-cta-active");
  });
  $(document).delegate(".wpdiscuz-nofollow,.wc_captcha_refresh_img,.wc-toggle,.wc-load-more-link", "click", e => {
    e.preventDefault();
  });
  $(document).delegate(".wc-toggle", "click", function() {
    const uniqueID = getUniqueID($(this), 0);
    const toggleSpan = $(this);
    $(`#wc-comm-${uniqueID}> .wc-reply`).slideToggle(700, function() {
      if ($(this).is(":hidden")) {
        toggleSpan.html(`<i class="fa fa-chevron-down" aria-hidden="true"  title="${wpdiscuzAjaxObj.wpdiscuz_options.wc_show_replies_text}"></i>`);
      } else {
        toggleSpan.html(`<i class="fa fa-chevron-up" aria-hidden="true"  title="${wpdiscuzAjaxObj.wpdiscuz_options.wc_hide_replies_text}"></i>`);
      }
    });
  });
  $(document).delegate(".wc-new-loaded-comment", "mouseenter", function() {
    if ($(this).hasClass("wc-reply")) {
      $(">.wc-comment-right", this).css("backgroundColor", wpdiscuzAjaxObj.wpdiscuz_options.wc_reply_bg_color);
    } else {
      $(">.wc-comment-right", this).css("backgroundColor", wpdiscuzAjaxObj.wpdiscuz_options.wc_comment_bg_color);
    }
  });
  $(document).delegate(".wc_captcha_refresh_img", "click", function() {
    changeCaptchaImage($(this));
  });
  $(document).delegate(".wc_comm_submit", "click", function() {
    let depth = 1;
    const wcForm = $(this).parents("form");
    if (!wcForm.hasClass("wc_main_comm_form")) {
      depth = getCommentDepth($(this).parents(".wc-comment"));
    }
    if (!wpdiscuzAjaxObj.wpdiscuz_options.is_email_field_required && $(".wc_email", wcForm).val()) {
      $(".wc_email", wcForm).attr("required", "required");
    }
    if (!wpdiscuzAjaxObj.wpdiscuz_options.is_email_field_required && !$(".wc_email", wcForm).val()) {
      $(".wc_email", wcForm).removeAttr("required");
    }
    wpdGoogleRecaptchaValid = true;
    wpdValidateFieldRequired(wcForm);
    wcForm.submit(event => {
      event.preventDefault();
    });
    if (wcForm[0].checkValidity() && wpdGoogleRecaptchaValid) {
      const data = new FormData;
      data.append("action", "addComment");
      const inputs = $(":input", wcForm);
      inputs.each(function() {
        if (this.name != "" && (this.type != "checkbox" && this.type != "radio")) {
          data.append(`${this.name}`, $(this).val());
        }
        if (this.type == "checkbox" || this.type == "radio") {
          if ($(this).is(":checked")) {
            data.append(`${this.name}`, $(this).val());
          }
        }
      });
      data.append("wc_comment_depth", depth);
      if (wpdiscuzUploader == 1) {
        const images = $(wcForm).find("input.wmu-image");
        const videos = $(wcForm).find("input.wmu-video");
        const files = $(wcForm).find("input.wmu-file");
        if (images.length > 0) {
          $.each($(images), (i, imageFile) => {
            if (imageFile.files.length > 0) {
              $.each(imageFile.files, (j, imageObj) => {
                data.append(`wmu_images[${i}]`, imageObj);
              });
            }
          });
        }
        if (videos.length > 0) {
          $.each($(videos), (i, videoFile) => {
            if (videoFile.files.length > 0) {
              $.each(videoFile.files, (j, videoObj) => {
                data.append(`wmu_videos[${i}]`, videoObj);
              });
            }
          });
        }
        if (files.length > 0) {
          $.each($(files), (i, file) => {
            if (file.files.length > 0) {
              $.each(file.files, (j, fileObj) => {
                data.append(`wmu_files[${i}]`, fileObj);
              });
            }
          });
        }
      }
      if (!wpdiscuzRecaptcha && (!isGoodbyeCaptchaActive && ((isShowCaptchaForGuests || isShowCaptchaForMembers) && !isCaptchaInSession))) {
        const image = $(".wc_captcha_img", wcForm);
        const src = image.attr("src");
        const lastIndex = src.lastIndexOf("/") + 1;
        const fileName = src.substring(lastIndex);
        data.append("fileName", fileName);
      }
      if ($.cookie("wc_author_name") && !$(".wc_name", wcForm).val()) {
        data.append("wc_name", $.cookie("wc_author_name"));
      }
      if ($.cookie("wc_author_email") && !$(".wc_email", wcForm).val()) {
        data.append("wc_email", $.cookie("wc_author_email"));
      }
      if (wpdiscuzAjaxObj.wpdiscuz_options.wpdiscuz_zs) {
        data.append("wpdiscuz_zs", wpdiscuzAjaxObj.wpdiscuz_options.wpdiscuz_zs);
      }
      getAjaxObj(data).done(response => {
        let messageKey = "";
        let message = "";
        try {
          const obj = $.parseJSON(response);
          messageKey = obj.code;
          if (parseInt(messageKey) >= 0) {
            const isMain = obj.is_main;
            message = obj.message;
            $(".wc_header_text_count").html(obj.wc_all_comments_count_new);
            if (isMain) {
              $(".wc-thread-wrapper").prepend(message);
            } else {
              $(`#wc-secondary-form-wrapper-${messageKey}`).slideToggle(700);
              if (obj.is_in_same_container == 1) {
                $(`#wc-secondary-form-wrapper-${messageKey}`).after(message);
              } else {
                $(`#wc-secondary-form-wrapper-${messageKey}`).after(message.replace("wc-reply", "wc-reply wc-no-left-margin"));
              }
            }
            notifySubscribers(obj);
            wpdiscuzRedirect(obj);
            addCookie(wcForm, obj);
            wcForm.get(0).reset();
            setCookieInForm();
            displayShowHideReplies();
            const currTArea = $(".wc_comment", wcForm);
            currTArea.css("height", "72px");
            setTextareaCharCount(currTArea, commentTextMaxLength);
            $(".wmu-preview-wrap", wcForm).remove();
            if (wpdiscuzReplyButton.length) {
              wpdiscuzReplyButton.removeClass("wc-cta-active");
            }
          } else {
            message = wpdiscuzAjaxObj.wpdiscuz_options[messageKey];
            if (obj.typeError != "undefined" && obj.typeError != null) {
              message += ` ${obj.typeError}`;
            }
            wpdiscuzAjaxObj.setCommentMessage(wcForm, messageKey, message, true);
          }
          if (obj.callbackFunctions != null && (obj.callbackFunctions != "undefined" && obj.callbackFunctions.length)) {
            $.each(obj.callbackFunctions, i => {
              if (typeof wpdiscuzAjaxObj[obj.callbackFunctions[i]] === "function") {
                wpdiscuzAjaxObj[obj.callbackFunctions[i]](messageKey, wcForm);
              } else {
                console.log(`${obj.callbackFunctions[i]} is not a function`);
              }
            });
          }
        } catch (e) {
          if (response.includes("<") && response.includes(">")) {
            message = e;
          } else {
            message = response;
          }
          wpdiscuzAjaxObj.setCommentMessage(wcForm, "wc_invalid_field", message, true);
        }
        $(".wpdiscuz-loading-bar").hide();
      });
    }
    changeCaptchaImage($(".wc_captcha_refresh_img", wcForm));
    wpdiscuzReset();
  });
  let wcCommentTextBeforeEditing;
  $(document).delegate(".wc_editable_comment", "click", function() {
    const uniqueID = getUniqueID($(this), 0);
    const commentID = getCommentID(uniqueID);
    const editButton = $(this);
    const data = new FormData;
    data.append("action", "editComment");
    data.append("commentId", commentID);
    const wcCommentTextBeforeEditingTop = $(`#wc-comm-${uniqueID} .wpd-top-custom-fields`);
    const wcCommentTextBeforeEditingBottom = $(`#wc-comm-${uniqueID} .wpd-bottom-custom-fields`);
    wcCommentTextBeforeEditing = wcCommentTextBeforeEditingTop.length ? `<div class="wpd-top-custom-fields">${wcCommentTextBeforeEditingTop.html()}</div>` : "";
    wcCommentTextBeforeEditing += `<div class="wc-comment-text">${$("#wc-comm-" + uniqueID + " .wc-comment-text").html()}</div>`;
    wcCommentTextBeforeEditing += wcCommentTextBeforeEditingBottom.length ? `<div class="wpd-bottom-custom-fields">${$("#wc-comm-" + uniqueID + " .wpd-bottom-custom-fields").html()}</div>` : "";
    getAjaxObj(data).done(response => {
      try {
        const obj = $.parseJSON(response);
        let message = "";
        const messageKey = obj.code;
        if (parseInt(messageKey) >= 0) {
          $(`#wc-comm-${uniqueID} .wpd-top-custom-fields`).remove();
          $(`#wc-comm-${uniqueID} .wpd-bottom-custom-fields`).remove();
          $(`#wc-comm-${uniqueID} > .wc-comment-right .wc-comment-text`).replaceWith(obj.message);
          $(`#wc-comm-${uniqueID} > .wc-comment-right .wc-comment-footer .wc_editable_comment`).hide();
          $(`#wc-comm-${uniqueID} > .wc-comment-right .wc-comment-footer .wc_cancel_edit`).css("display", "inline-block");
          const editForm = $(`#wc-comm-${uniqueID} > .wc-comment-right #wpdiscuz-edit-form`);
          wpdiscuzReplaceValidationUI(editForm[0]);
        } else {
          message = wpdiscuzAjaxObj.wpdiscuz_options[messageKey];
          wpdiscuzAjaxObj.setCommentMessage(editButton, messageKey, message, false);
        }
      } catch (e) {
        console.log(e);
      }
      $(".wpdiscuz-loading-bar").hide();
    });
  });
  $(document).delegate(".wc_save_edited_comment", "click", function() {
    const uniqueID = getUniqueID($(this));
    const commentID = getCommentID(uniqueID);
    const editCommentForm = $(`#wc-comm-${uniqueID} #wpdiscuz-edit-form`);
    const saveButton = $(this);
    wpdValidateFieldRequired(editCommentForm);
    editCommentForm.submit(event => {
      event.preventDefault();
    });
    if (editCommentForm[0].checkValidity()) {
      const data = new FormData;
      data.append("action", "saveEditedComment");
      data.append("commentId", commentID);
      const inputs = $(":input", editCommentForm);
      inputs.each(function() {
        if (this.name != "" && (this.type != "checkbox" && this.type != "radio")) {
          data.append(`${this.name}`, $(this).val());
        }
        if (this.type == "checkbox" || this.type == "radio") {
          if ($(this).is(":checked")) {
            data.append(`${this.name}`, $(this).val());
          }
        }
      });
      getAjaxObj(data).done(response => {
        try {
          const obj = $.parseJSON(response);
          const messageKey = obj.code;
          var message = "";
          if (parseInt(messageKey) >= 0) {
            wcCancelOrSave(uniqueID, obj.message);
          } else {
            message = wpdiscuzAjaxObj.wpdiscuz_options[messageKey];
            wpdiscuzAjaxObj.setCommentMessage(saveButton, messageKey, message, false);
          }
          if (obj.callbackFunctions != null && (obj.callbackFunctions != "undefined" && obj.callbackFunctions.length)) {
            $.each(obj.callbackFunctions, i => {
              if (typeof wpdiscuzAjaxObj[obj.callbackFunctions[i]] === "function") {
                wpdiscuzAjaxObj[obj.callbackFunctions[i]](messageKey, commentID, commentContent);
              } else {
                console.log(`${obj.callbackFunctions[i]} is not a function`);
              }
            });
          }
        } catch (e) {
          if (response.includes("<") && response.includes(">")) {
            message = e;
          } else {
            message = response;
          }
          wpdiscuzAjaxObj.setCommentMessage(saveButton, "wc_invalid_field", message, false);
        }
        $(".wpdiscuz-loading-bar").hide();
      });
    }
  });
  $(document).delegate(".wc_cancel_edit", "click", function() {
    const uniqueID = getUniqueID($(this));
    wcCancelOrSave(uniqueID, wcCommentTextBeforeEditing);
  });
  $(document).delegate(".wc-load-more-submit", "click", function() {
    const loadButton = $(this);
    const loaded = "wc-loaded";
    const loading = "wc-loading";
    if (loadButton.hasClass(loaded)) {
      wpdiscuzLoadComments(loadButton, loaded, loading);
    }
  });
  var wpdiscuzHasMoreComments = $("#wpdiscuzHasMoreComments").val();
  var isRun = false;
  if (commentListLoadType == 2 && !wordpressIsPaginate) {
    $(".wc-load-more-submit").parents(".wpdiscuz-comment-pagination").hide();
    $(window).scroll(() => {
      const scrollHeight = document.getElementById("wcThreadWrapper").scrollHeight;
      if ($(window).scrollTop() >= scrollHeight && (isRun === false && wpdiscuzHasMoreComments == 1)) {
        isRun = true;
        wpdiscuzLoadComments($(".wc-load-more-submit"));
      }
    });
  }
  $(document).delegate(".wc_vote.wc_not_clicked", "click", function() {
    const currentVoteBtn = $(this);
    $(currentVoteBtn).removeClass("wc_not_clicked");
    let messageKey = "";
    let message = "";
    let commentID = $(this).parents(".wc-comment-right").attr("id");
    commentID = commentID.substring(commentID.lastIndexOf("-") + 1);
    let voteType;
    if ($(this).hasClass("wc-up")) {
      voteType = 1;
    } else {
      voteType = -1;
    }
    const data = new FormData;
    data.append("action", "voteOnComment");
    data.append("commentId", commentID);
    data.append("voteType", voteType);
    getAjaxObj(data).done(response => {
      $(currentVoteBtn).addClass("wc_not_clicked");
      try {
        const obj = $.parseJSON(response);
        messageKey = obj.code;
        if (parseInt(messageKey) >= 0) {
          if (obj.buttonsStyle == "total") {
            const voteCountDiv = $(".wc-comment-footer .wc-vote-result", $(`#comment-${commentID}`));
            voteCountDiv.text(parseInt(voteCountDiv.text()) + voteType);
          } else {
            const likeCountDiv = $(".wc-comment-footer .wc-vote-result-like", $(`#comment-${commentID}`));
            const dislikeCountDiv = $(".wc-comment-footer .wc-vote-result-dislike", $(`#comment-${commentID}`));
            likeCountDiv.text(obj.likeCount);
            dislikeCountDiv.text(obj.dislikeCount);
            if (parseInt(obj.likeCount) > 0) {
              likeCountDiv.addClass("wc-positive");
            } else {
              likeCountDiv.removeClass("wc-positive");
            }
            if (parseInt(obj.dislikeCount) < 0) {
              dislikeCountDiv.addClass("wc-negative");
            } else {
              dislikeCountDiv.removeClass("wc-negative");
            }
          }
        } else {
          message = wpdiscuzAjaxObj.wpdiscuz_options[messageKey];
          wpdiscuzAjaxObj.setCommentMessage(currentVoteBtn, messageKey, message, false);
        }
        if (obj.callbackFunctions != null && (obj.callbackFunctions != "undefined" && obj.callbackFunctions.length)) {
          $.each(obj.callbackFunctions, i => {
            if (typeof wpdiscuzAjaxObj[obj.callbackFunctions[i]] === "function") {
              wpdiscuzAjaxObj[obj.callbackFunctions[i]](messageKey, commentID, voteType);
            } else {
              console.log(`${obj.callbackFunctions[i]} is not a function`);
            }
          });
        }
      } catch (e) {
        console.log(e);
      }
      $(".wpdiscuz-loading-bar").hide();
    });
  });
  $(document).delegate(".wpdiscuz-sort-button", "click", function() {
    wpdiscuzHasMoreComments = $("#wpdiscuzHasMoreComments").val();
    if (!$(this).hasClass("wpdiscuz-sort-button-active")) {
      const clickedBtn = $(this);
      if ($(this).hasClass("wpdiscuz-vote-sort-up")) {
        wpdiscuzCommentOrderBy = "by_vote";
        wpdiscuzCommentOrder = "desc";
      } else {
        wpdiscuzCommentOrderBy = "comment_date_gmt";
        wpdiscuzCommentOrder = $(this).hasClass("wpdiscuz-date-sort-desc") ? "desc" : "asc";
      }
      const data = new FormData;
      data.append("action", "wpdiscuzSorting");
      data.append("orderBy", wpdiscuzCommentOrderBy);
      data.append("order", wpdiscuzCommentOrder);
      let messageKey = "";
      let message = "";
      getAjaxObj(data).done(response => {
        try {
          const obj = $.parseJSON(response);
          messageKey = obj.code;
          message = obj.message;
          if (parseInt(messageKey) > 0) {
            $("#wpcomm .wc-thread-wrapper .wc-comment").each(function() {
              $(this).remove();
            });
            $("#wpcomm .wc-thread-wrapper").prepend(message);
            wpdiscuzLoadCount = parseInt(obj.loadCount);
          } else {
          }
          setActiveButton(clickedBtn);
          setLoadMoreVisibility(obj);
        } catch (e) {
          console.log(e);
        }
        displayShowHideReplies();
        $(".wpdiscuz-loading-bar").hide();
      });
    }
  });
  getSingleComment();
  if (commentListUpdateType > 0 && (loadLastCommentId && (isUserLoggedIn || !isUserLoggedIn && !disableGuestsLiveUpdate))) {
    setInterval(liveUpdate, parseInt(commentListUpdateTimer) * 1E3);
  }
  $(document).delegate(".wc-update-on-click", "click", function() {
    const data = new FormData;
    data.append("action", "updateOnClick");
    const clickedButton = $(this);
    if (clickedButton.hasClass("wc_new_comment")) {
      data.append("newCommentIds", wpdiscuzCommentArray.join());
    } else {
      data.append("newCommentIds", wpdiscuzReplyArray.join());
    }
    getAjaxObj(data).done(response => {
      try {
        const obj = $.parseJSON(response);
        liveUpdateImmediately(obj);
        if (clickedButton.hasClass("wc_new_comment")) {
          wpdiscuzCommentArray = [];
          $(".wc_new_comment").hide();
        } else {
          wpdiscuzReplyArray = [];
          $(".wc_new_reply").hide();
        }
      } catch (e) {
        console.log(e);
      }
      $(".wpdiscuz-loading-bar").hide();
    });
  });
  $(document).delegate(".wpdiscuz-readmore", "click", function() {
    const uniqueId = getUniqueID($(this));
    const commentId = getCommentID(uniqueId);
    const data = new FormData;
    data.append("action", "readMore");
    data.append("commentId", commentId);
    getAjaxObj(data).done(response => {
      try {
        const obj = $.parseJSON(response);
        if (obj.code) {
          $(`#comment-${commentId} .wc-comment-text`).html(` ${obj.message}`);
          $(`#wpdiscuz-readmore-${uniqueId}`).remove();
        }
      } catch (e) {
        console.log(e);
      }
      $(".wpdiscuz-loading-bar").hide();
    });
  });
  wpdiscuzAjaxObj.setCommentMessage = (field, messageKey, message, isFormError) => {
    let msgContainer;
    let parentContainer;
    if (isFormError) {
      parentContainer = field.parents(".wc-form-wrapper");
    } else {
      parentContainer = field.closest(".wc-comment");
    }
    msgContainer = parentContainer.children(".wpdiscuz-comment-message");
    msgContainer.removeClass();
    msgContainer.addClass("wpdiscuz-comment-message");
    msgContainer.addClass(messageKey);
    msgContainer.html(message);
    msgContainer.show().delay(4E3).fadeOut(1E3, () => {
      msgContainer.removeClass();
      msgContainer.addClass("wpdiscuz-comment-message");
      msgContainer.html("");
    });
  };
  $(document).delegate(".wc_comm_submit, .wc_save_edited_comment", "click", function() {
    const curentForm = $(this).parents("form");
    const invalidFields = $(":invalid", curentForm);
    const errorMessages = $(".error-message", curentForm);
    let parent;
    let i = 0;
    for (;i < errorMessages.length;i++) {
      errorMessages[i].parentNode.removeChild(errorMessages[i]);
    }
    i = 0;
    for (;i < invalidFields.length;i++) {
      parent = invalidFields[i].parentNode;
      const oldMsg = parent.querySelector(".wpd-field-invalid");
      if (oldMsg) {
        parent.removeChild(oldMsg);
      }
      if (invalidFields[i].validationMessage !== "") {
        parent.insertAdjacentHTML("beforeend", `<div class='wpd-field-invalid'><span>${invalidFields[i].validationMessage}</span></div>`);
      }
    }
  });
  $(document).delegate(".wpdiscuz-item input,.wpdiscuz-item textarea,.wpdiscuz-item select", "click", function() {
    wpdiscuzRemoveError($(this));
  });
  $(document).delegate(".wpdiscuz-item input,.wpdiscuz-item textarea,.wpdiscuz-item select", "focus", function() {
    wpdiscuzRemoveError($(this));
  });
  $(document).delegate(".wpd-required-group", "change", function() {
    if ($("input:checked", this).length !== 0) {
      $(".wpd-field-invalid", this).remove();
      $("input", $(this)).removeAttr("required");
    } else {
      $("input", $(this)).attr("required", "required");
    }
  });
});