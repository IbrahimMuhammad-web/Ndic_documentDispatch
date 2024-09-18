const user_email = JSON.parse(
  document.getElementById("user_email").textContent
);
const user_firstn = JSON.parse(
  document.getElementById("first_name").textContent
);
const user_lastn = JSON.parse(
  document.getElementById("last_name").textContent
);

// Ensure DOM is fully loaded before executing SPA logic
document.addEventListener("DOMContentLoaded", function () {
  // Set initial application state (inbox) and update history
  history.replaceState({ mailbox: "inbox" }, "Default state", "#inbox"); //default state
  // Efficiently listen for popstate events (back/forward button)
  window.addEventListener("popstate", (e) => {
    
    // Optional debugging - uncomment to log history state during navigation
    // console.log(e.state);

    // Handle search query navigation
    if(e.state.query){
      load_mailbox("search" ,e.state.query);
    }
    else if(e.state.email) {
      // Parse email content from history state
      let doc = new DOMParser().parseFromString(e.state.element, 'text/html');
      veiw_email(e.state.email,doc, e.state.mail);
    }
    else if(e.state.mailbox !== null) {
      // Navigate to mailbox based on history state
      if (e.state.mailbox !== "compose") {
        load_mailbox(e.state.mailbox);
      } else {
        compose_email();
      }
    }

    // if(e.state.){
    //   load_mailbox(e.state.mailbox);
    // }
  });
  // Sidebar toggler
  $("#sidebarCollapse").on("click", function () {
    $("#sidebar").toggleClass("side_active");
    $(".main").toggleClass("spread");
    // show overlay when menu appears on mobile devices
    if ($(window).width() <= 768) {
      $(".overlay").addClass("over_active");
    }
  });

  // hide overlay when it is clicked
  $(".overlay").on("click", function () {
    // hide sidebar
    $("#sidebar").removeClass("side_active");
    // hide overlay
    $(".overlay").removeClass("over_active");
  });

  window.addEventListener('resize', function(event){
    // Check if window width is greater than 768px (larger screens)
    if ($(window).width() > 768) {
      if($(".main").hasClass("spread")){
        $("#sidebar").addClass("side_active");
      }
      document.querySelector('.navbar').style.display = "flex";
      
    }
    if ($(window).width() <= 768){
      if($("#sidebar").hasClass("side_active")){
        $(".overlay").addClass("over_active");
      }
      else{
        $(".overlay").removeClass("over_active");
      }
    }
  });

  // navigation link clicks, updating the application state and history to ensure a smooth user experience.
  // Active Nav-links style
  $(".nav-link").each(function () {
    var link = this;
    // console.log($(".mailbox_head").text)
    // if the current path is like this link, make it active
    link.addEventListener("click", function () {
      let maildiv;
      
      if(document.querySelector("#emails-view").style.display !== "none"){
        maildiv = document.querySelector(".mailbox_head").textContent;
        if( maildiv.toLowerCase() !== link.id){
          // console.log(maildiv)
          history.pushState({ mailbox: link.id }, "", `./#${link.id}`);
          if(link.id !== "compose") load_mailbox(link.id);
        }
      }
      else{
        history.pushState({ mailbox: link.id }, "", `./#${link.id}`);
          if(link.id !== "compose") load_mailbox(link.id);
      }
     
    });
  });

  // Avatar based on Username
  let avatars = document.querySelectorAll(".user-icon");
  avatars.forEach((avatar) => {
    avatar.style.backgroundColor = calculateColor(user_email);
    avatar.innerHTML = user_firstn.charAt(0).toUpperCase();
  });

  // search bar
  document.querySelector(".srch-form").addEventListener("submit", (e) => {
    let srch_query = document.querySelector(".srch-inp").value;
    // console.log(srch_query);
    if (srch_query.trim().length > 0) {
      history.pushState({ query: srch_query.trim() }, "", `./#search/${srch_query.trim()}`);
      load_mailbox("search", srch_query.trim());
    }
    e.preventDefault();
  });

  document.querySelector("#compose").addEventListener("click", () => {
    if(document.querySelector("#compose-view").style.display === "none"){
      compose_email()
    }
  });
  document.querySelector("#compose-title").addEventListener("click", () => {
    if(document.querySelector("#compose-view").style.display === "none"){
      compose_email()
    }
  });
  document.querySelector("#Exmail").addEventListener("click", () => {
    if(document.querySelector("#External-view").style.display === "none"){
      compose_External_email()
    }
    else if(document.querySelector("#External-view").style.display !== "none"){
      compose_External_email()
    }
  });
  // document.querySelector("#admin-dashboard").addEventListener("click", () => {
  //   if(document.querySelector("#dashboard").style.display === "none"){
  //     admin_dashboard()
  //   }
  // });
  // document.querySelector("#user-table").addEventListener("click", () => {
  //   if(document.querySelector("#user-tables").style.display === "none"){
  //     user_table()
  //   }
  // });
  // document.querySelector("#internal-mails").addEventListener("click", () => {
  //   if(document.querySelector("#inmails-table").style.display === "none"){
  //     internal_mails()
  //   }
  // });
  // document.querySelector("#external-mails").addEventListener("click", () => {
  //   if(document.querySelector("exmails-tables").style.display === "none"){
  //     external_mails()
  //   }
  // });
  // history.pushState({compose : }, "", `./#${link.id}`)
  // By default, load the inbox
  load_mailbox("inbox");
});

// Function to handle composing a new email
function compose_email(email = null, status="") {
  tog_menu(); // toggle sidebar when on mobile devices
  if($(window).width() <= 768){
    document.querySelector('.navbar').style.display = "flex";
  }
  // Initialize the rich text editor for composing the email body
  if (document.querySelector("#compose-view").style.display === "none") {
    // create new instance of balloonEditor
    BalloonEditor.create(document.querySelector("#compose-body"))
      .then((editor) => {
        // console.log( editor );
        editor.setData("");
        
        document.querySelector("#compose").addEventListener("click", () => {
          editor.setData("");
        });
        document.querySelector("#compose-title").addEventListener("click", () => {
          editor.setData("");
        });
        // destroy editor instance if the compose view is not visible
        let targetNode = document.querySelector("#compose-view");
        let observer = new MutationObserver(function () {
          if (targetNode.style.display == "none") {
            editor.destroy();
          }
        });
        observer.observe(targetNode, { attributes: true });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Show compose view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#check-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "block";
  document.querySelector("#External-view").style.display = "none";
  document.querySelector("#title").style.display = "block";
  

  // Clear out composition fields
  document.querySelector("#compose-through").value = "";
  document.querySelector("#compose-recipients").value = "";
  document.querySelector("#compose-subject").value = "";
  document.querySelector("#compose-amount").value = "";
  document.querySelector("#compose-refCode").value = "";


  document.querySelector("#compose-form").onsubmit = () => {
    const through = document.querySelector("#compose-through").value;
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const amount = document.querySelector("#compose-amount").value;
    const refCode = document.querySelector("#compose-refCode").value;
    // console.log(body)

    fetch("/emails", {
      method: "POST",
      body: JSON.stringify({
        through: through,
        recipients: recipients,
        subject: subject,
        amount: amount,
        refCode: refCode,

      }),
    })
      .then((response) => response.json())
      .then((result) => {
        // Print result
        // console.log(result);
        custm_alert(result);
      });

    return false;
  };
}

function compose_External_email(email = null, status="") {
  tog_menu(); // toggle sidebar when on mobile devices
  if($(window).width() <= 768){
    document.querySelector('.navbar').style.display = "flex";
  }
  // Initialize the rich text editor for composing the email body
  if (document.querySelector("#External-view").style.display === "none") {
    // create new instance of balloonEditor
    BalloonEditor.create(document.querySelector("#External-body"))
      .then((editor) => {
        // console.log( editor );
        editor.setData("");
        document.querySelector("#Exmail").addEventListener("click", () => {
          editor.setData("");
        });
        // destroy editor instance if the compose view is not visible
        let targetNode = document.querySelector("#External-view");
        let observer = new MutationObserver(function () {
          if (targetNode.style.display == "none") {
            editor.destroy();
          }
        });
        observer.observe(targetNode, { attributes: true });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  // Show external view and hide other views
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#check-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#External-view").style.display = "block";
  document.querySelector("#title").style.display = "block";

  // Clear out composition fields
  document.querySelector("#External-type").value = "";
  document.querySelector("#External-from").value = "";
  document.querySelector("#External-through").value = "";
  document.querySelector("#External-recipients").value = "";
  document.querySelector("#External-subject").value = "";


  document.querySelector("#External-form").onsubmit = () => {
    const type = document.querySelector("#External-type").value;
    const from = document.querySelector("#External-from").value;
    const through = document.querySelector("#External-through").value;
    const recipients = document.querySelector("#External-recipients").value;
    const subject = document.querySelector("#External-subject").value;
    // console.log(body)

    fetch("/external_emails", {
      method: "POST",
      body: JSON.stringify({
        type: type,
        from: from,
        through: through,
        recipients: recipients,
        subject: subject,
      }),
    })
      .then((response) => response.json())
      .then((result) => {
        // Print result
        // console.log(result);
        custm_alert(result);
      });

    return false;
  };
}

async function load_mailbox(mailbox, query = "") {
  tog_menu();

  if(mailbox !== "search"){
    // Remove "active" class from all navigation links
    $(".nav-link").each(function () {
      // console.log(this.id);
      $(this).removeClass("active");
    });
    // Add "active" class to the current mailbox navigation link
    $(`#${mailbox}`).addClass("active");
  }
  
  // Show the mailbox and hide other views
  if($(window).width() <= 768){
    document.querySelector('.navbar').style.display = "flex";
  }
  document.querySelector("#emails-view").style.display = "block";
  document.querySelector("#check-email").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#External-view").style.display = "none";
  document.querySelector("#title").style.display = "none";


  // Show the mailbox name
  // console.log(mailbox);
  spinner = `
  <div class="d-flex justify-content-center spin my-5">
    <div class="spinner-border text-danger" role="status">
      <span class="sr-only">Loading...</span>
    </div>
  </div>`;

  // Display the mailbox name with the first letter capitalized
  function mailboxTitle(title) {
    document.querySelector(
      "#emails-view"
    ).innerHTML = `<h4 class="mailbox_head py-2 pl-3 m-0 mx-1">${
      title
    }</h4> ${spinner}`;
  }

  if (mailbox === "inbox") {
    mailboxTitle("Incoming Mails");
  }

  else if (mailbox === "sent") {
    mailboxTitle("Outgoing Mails");
  }

  else if (mailbox === "Received") {
    mailboxTitle("Received Mails");
  }
  
  else if (mailbox === "incoming Courier") {
    mailboxTitle("Incoming Courier");
  }
  
  else if (mailbox === "outgoing Courier") {
    mailboxTitle("Outgoing Courier");
  }
  
  else if (mailbox === "trash") {
    mailboxTitle("Internal Mails Recently Deleted");
  }
  
  else if (mailbox === "Exmail_trash") {
    mailboxTitle("External Mails Recently Deleted");
  }

  else if (mailbox === "search") {
    mailboxTitle("Search: "+ query);
  }
  // console.log(mailbox);
  // check If it's the search mailbox, update the URL endpoint if true
  if (mailbox === "search") {
    mailbox = `search/${query}`;
  }


  // check and Fetch emails from the server based on the mailbox type
  // Check if mailbox exists using a HEAD request
  const mailboxExists = await fetch(`/emails/${mailbox}`, { method: 'HEAD' })
  .then(response => response.ok);
  const ExmailboxExists = await fetch(`/external_emails/${mailbox}`, { method: 'HEAD' })
  .then(response => response.ok);
  if (mailboxExists) {
      fetch(`/emails/${mailbox}`)
      .then((response) => response.json())
      .then((emails) => {
          $(".spin").removeClass("d-flex").addClass("d-none");
          // Print emails
          // console.log(emails);
          if (emails.error) {
          document.querySelector(
              "#emails-view"
          ).innerHTML += `<h5 class="pl-3 pt-2">${emails.error} for "${query}"</h5>`;
          }
          else if(emails.length > 0){
          // ... do something else with emails ...
          emails.forEach((email) => {
          const element = document.createElement("div");
          element.classList.add(
              "row",
              "my-0",
              "mx-1",
              "single-mail"
          );
          element.style.cursor = "pointer";
          element.innerHTML = `
          ${(() => {
  
  
              let sender = email.username;
              let user_avatar = `<div class="user-icon-wrapper" >
                              <span class="singlemail-user-icon rounded-circle text-white" style="background-color:${calculateColor(
                                  email.sender
                              )}">${sender.charAt(0).toUpperCase()}</span>
                              </div>`;
              let sendto = email.recipients;
              if (sendto.includes(sender)) {
              let index = sendto.indexOf(email.username);
              sendto[index] = email.sender;
              sender = email.sender;
              }
              if(user_email === email.sender){
              sender = email.sender;
              }
              if (mailbox === "sent") {
              sender = `To: ${sendto}`;
              }
  
              let del_stat = email.deleted ? "Restore" : "Delete"
  
              let mark_read_stat = "Mark as Unread";
              // Add a class to indicate unread email and update button text
              if (!email.read) {
              mark_read_stat = "Mark as Read";
              element.classList.add("unread");
              } else {
              element.classList.add("light");
              element.classList.remove("unread");
              }
      
                let mark_class = email.read ? "fa-envelope-open" : "fa-envelope";
                let del_class = email.deleted ? "fa-recycle" : "fa-trash";
                let del_forever = mailbox === "trash" || mailbox === "Exmail_trash" ?`<li class="btn-item del_forever" data-toggle="tooltip" data-placement="bottom" title="Delete forever"><i class="fas fa-trash"></i></li>   ` :"";
                let ext_btn = mailbox === "trash" || mailbox === "Exmail_trash"? "ext_btn": "";
                const maxLength = 30; // Adjust this value as needed
                const subject = email.subject.length > maxLength ? email.subject.slice(0, maxLength) + '...' : email.subject;
                
                // mail design layout html code
                if (mailbox === "inbox" || mailbox === "Received" || mailbox === `search/${query}`) {
                  const amount = email.amount
                  const formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                  if (!email.read){
                  return `
                  ${user_avatar}
                  <div class="sender">${sender}</div>
                  <div class="subject text-left">
                      <div class="d-inline">${
                      email.subject.length > 0 ? subject.toUpperCase() : "(no subject)"
                      }</div>
                  </div>
                  <div class="timestamp ${ext_btn}">
                  <span id="time">${readable_date(email.timestamp)}</span>
                  <ul class="btn-list">
                      <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                        email.amount.length > 0 ? `₦${formattedAmount}` : ""
                        }</li>
                      <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                      email.referenceCode
                      }</li>
                      <li class="btn-item mark-read" data-toggle="tooltip" data-placement="bottom" title="${mark_read_stat}"><i class="fas ${mark_class}"></i></li>
                      <li class="btn-item delete" data-toggle="tooltip" data-placement="bottom" title="${del_stat}"><i class="fas ${del_class}"></i></li>   
                      ${del_forever}
                  </ul>
                  </div>
                  `;
                  } else {
                    return `
                    ${user_avatar}
                    <div class="sender">${sender}</div>
                    <div class="subject text-left">
                        <div class="d-inline">${
                        email.subject.length > 0 ? subject.toUpperCase() : "(no subject)"
                        }</div>
                    </div>
                    <div class="timestamp ${ext_btn}">
                    <span id="time">${readable_date(email.timestamp)}</span>
                    <ul class="btn-list">
                        <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                        email.amount.length > 0 ? `₦${formattedAmount}` : ""
                        }</li>
                        <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                        email.referenceCode
                        }</li>
                        <li class="mark-read"></li>
                        <li class="delete"></li>
                        <span id="time">${readable_date(email.timestamp)}</span>
                    </ul>
                    </div>
                    `;
                    }
              }
              else if (mailbox === "sent"){
                const amount = email.amount
                const formattedAmount = amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                if (!email.read){
                  return `
                  ${user_avatar}
                  <div class="sender">${sender}</div>
                  <div class="subject text-left">
                      <div class="d-inline">${
                      email.subject.length > 0 ? subject.toUpperCase() : "(no subject)"
                      }</div>
                  </div>
                  <div class="timestamp ${ext_btn}">
                  <span id="time">${readable_date(email.timestamp)}</span>
                  <ul class="btn-list">
                      <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                      email.amount.length > 0 ? `₦${formattedAmount}` : ""
                      }</li>
                      <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                      email.referenceCode
                      }</li>
                      <li class="mark-read"></li>
                      <li class="btn-item delete" data-toggle="tooltip" data-placement="bottom" title="${del_stat}"><i class="fas ${del_class}"></i></li>   
                      ${del_forever}
                  </ul>
                  </div>
                  `;
                  } else {
                    return `
                    ${user_avatar}
                    <div class="sender">${sender}</div>
                    <div class="subject text-left">
                        <div class="d-inline">${
                        email.subject.length > 0 ? subject.toUpperCase() : "(no subject)"
                        }</div>
                    </div>
                    <div class="timestamp ${ext_btn}">
                    <span id="time">${readable_date(email.timestamp)}</span>
                    <ul class="btn-list">
                        <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                        email.amount.length > 0 ? `₦${formattedAmount}` : ""
                        }</li>
                        <li style="padding-right:20px; class="d-inline" data-placement="bottom">${
                        email.referenceCode
                        }</li>
                        <li class="mark-read"></li>
                        <li class="delete"></li>
                        <span id="time">${readable_date(email.timestamp)}</span>
                    </ul>
                    </div>
                    `;
                    }
              }
              else if(mailbox === "incoming Courier" || mailbox === "outgoing Courier"){
                if (!email.read){
                return `
                ${user_avatar}
                <div class="sender">${sender}</div>
                <div class="subject text-left">
                    <div class="d-inline">${
                    email.subject.length > 0 ? subject.toUpperCase() : "(no subject)"
                    }</div>
                </div>
                <div class="timestamp ${ext_btn}">
                <span id="time">${readable_date(email.timestamp)}</span>
                <ul class="btn-list">
                    <li class="mark-read"></li>
                    <li class="btn-item delete" data-toggle="tooltip" data-placement="bottom" title="${del_stat}"><i class="fas ${del_class}"></i></li>   
                    ${del_forever}
                </ul>
                </div>
                `;
                } else {
                  return `
                  ${user_avatar}
                  <div class="sender">${sender}</div>
                  <div class="subject text-left">
                      <div class="d-inline">${
                      email.subject.length > 0 ? subject.toUpperCase() : "(no subject)"
                      }</div>
                  </div>
                  <div class="timestamp ${ext_btn}">
                  <span id="time">${readable_date(email.timestamp)}</span>
                  <ul class="btn-list">
                    <li class="mark-read"></li>
                    <li class="delete"></li>
                    </ul>
                  </div>
                  `;
                  }
              }
              else if(mailbox === "trash" || mailbox === "Exmail_trash"){
                return `
                  ${user_avatar}
                  <div class="sender">${sender}</div>
                  <div class="subject text-left">
                      <div class="d-inline">${
                      email.subject.length > 0 ? subject.toUpperCase() : "(no subject)"
                      }</div>
                  </div>
                  <div class="timestamp ${ext_btn}">
                  <span id="time">${readable_date(email.timestamp)}</span>
                  <ul class="btn-list">
                      <li class="mark-read"></li>
                      <li class="btn-item delete" data-toggle="tooltip" data-placement="bottom" title="${del_stat}"><i class="fas ${del_class}"></i></li>   
                      ${del_forever}
                  </ul>
                  </div>
                  `;
              }
            })()}`;
          element.addEventListener(
              "click",
              (e) => {
              fetch(`/emails/${email.id}`, {
                  method: "PUT",
                  body: JSON.stringify({
                  // read: true,
                  }),
              });
              history.pushState(
                  { email: email.id ,
                  element : element.innerHTML,
                  mail: mailbox },
                  "",
                  `#${mailbox}/${email.id}`
              );
              // console.log(email.id);
              veiw_email(email.id, element, mailbox);
  
              e.stopImmediatePropagation();
              },
              false
          );
  
          mark_read(email, element, mailbox);
          mark_del(email, element, mailbox);
          if(mailbox === "trash" || mailbox === "Exmail_trash"){
              element.querySelector(".del_forever").addEventListener("click", (e)=>{
              fetch(`/emails/${email.id}`, {
                  method: "DELETE",
              });
              custm_alert("Conversation deleted forever")
              hide_element(element);
              e.stopImmediatePropagation();
              })
          }
          if ($(window).width() >= 768) {
              element.addEventListener(
              "mouseover",
              () => {
                  element.classList.add("shadow", "mail");
                  element.querySelector(":scope > div > #time").style.display =
                  "none";
                  element.querySelector(
                  ":scope > div > .btn-list"
                  ).style.visibility = "visible";
              },
              false
              );
  
              element.addEventListener(
              "mouseout",
              () => {
                  element.classList.remove("shadow", "mail");
                  // $('[data-toggle="tooltip"]').tooltip('hide');
                  element.querySelector(
                  ":scope > div > .btn-list"
                  ).style.visibility = "hidden";
                  element.querySelector(":scope > div > #time").style.display =
                  "block";
              },
              false
              );
          }
          document.querySelector("#emails-view").append(element);
          });
          }
          else{
          const empty = document.createElement("div");
          empty.classList.add(
              // "row",
              "d-flex",
              "flex-column",
              "mt-5",
          );
          empty.innerHTML = `
          <div class="text-center empty_icon"><i class="far fa-folder-open"></i></div>
          <div class="text-center empty_text">Nothing in ${mailbox}</div>`
          document.querySelector("#emails-view").append(empty);
      }
          $('[data-toggle="tooltip"]').tooltip();
      })
      .catch((error) => {
          console.log(error);
      });
  }

  else if (ExmailboxExists){
      fetch(`/external_emails/${mailbox}`)
      .then((response) => response.json())
      .then((emails) => {
          $(".spin").removeClass("d-flex").addClass("d-none");
          // Print emails
          // console.log(emails);
          if (emails.error) {
          document.querySelector(
              "#emails-view"
          ).innerHTML += `<h5 class="pl-3 pt-2">${emails.error} for "${query}"</h5>`;
          }
          else if(emails.length > 0){
          // ... do something else with emails ...
          emails.forEach((email) => {
          const element = document.createElement("div");
          element.classList.add(
              "row",
              "my-0",
              "mx-1",
              "single-mail"
          );
          element.style.cursor = "pointer";
          element.innerHTML = `
          ${(() => {
  
  
              let sender = email.username;
              let user_avatar = `<div class="user-icon-wrapper" >
                              <span class="singlemail-user-icon rounded-circle text-white" style="background-color:${calculateColor(
                                  email.sender
                              )}">${sender.charAt(0).toUpperCase()}</span>
                              </div>`;
              let sendto = email.recipients;
              if (sendto.includes(sender)) {
              let index = sendto.indexOf(email.username);
              sendto[index] = email.sender;
              sender = email.sender;
              }
              if(user_email === email.sender){
              sender = email.sender;
              }
              if (mailbox === "sent") {
              sender = `To: ${sendto}`;
              }
  
              let del_stat = email.deleted ? "Restore" : "Delete"
  
              let mark_read_stat = "Mark as Unread";
              // Add a class to indicate unread email and update button text
              if (!email.read) {
              mark_read_stat = "Mark as Read";
              element.classList.add("unread");
              } else {
              element.classList.add("light");
              element.classList.remove("unread");
              }
  
              let mark_class = email.read ? "fa-envelope-open" : "fa-envelope";
              let del_class = email.deleted ? "fa-recycle" : "fa-trash";
              let del_forever = mailbox === "trash" || mailbox === "Exmail_trash" ?`<li class="btn-item del_forever" data-toggle="tooltip" data-placement="bottom" title="Delete forever"><i class="fas fa-trash"></i></li>   ` :"";
              let ext_btn = mailbox === "trash" || mailbox === "Exmail_trash" ? "ext_btn": "";
              // mail design layout html code
              return `
              ${user_avatar}
              <div class="sender">${sender}</div>
              <div class="subject text-left">
                  <div class="d-inline">${
                  email.subject.length > 0 ? email.subject : "(no subject)"
                  }</div>
              </div>
              <div class="timestamp ${ext_btn}">
              <span id="time">${readable_date(email.timestamp)}</span>
              <ul class="btn-list">
                  <li class="btn-item mark-read" data-toggle="tooltip" data-placement="bottom" title="${mark_read_stat}"><i class="fas ${mark_class}"></i></li>
                  <li class="btn-item delete" data-toggle="tooltip" data-placement="bottom" title="${del_stat}"><i class="fas ${del_class}"></i></li>   
                  ${del_forever}
              </ul>
              </div>
              `;
          })()}`;
          element.addEventListener(
              "click",
              (e) => {
              fetch(`/external_emails/${email.id}`, {
                  method: "PUT",
                  body: JSON.stringify({
                  // read: true,
                  }),
              });
              history.pushState(
                  { email: email.id ,
                  element : element.innerHTML,
                  mail: mailbox },
                  "",
                  `#${mailbox}/${email.id}`
              );
              // console.log(email.id);
              veiw_email(email.id, element, mailbox);
  
              e.stopImmediatePropagation();
              },
              false
          );
  
          mark_read(email, element, mailbox);
          mark_del(email, element, mailbox);
          if(mailbox === "trash" || mailbox === "Exmail_trash"){
              element.querySelector(".del_forever").addEventListener("click", (e)=>{
              fetch(`/external_emails/${email.id}`, {
                  method: "DELETE",
              });
              custm_alert("Conversation deleted forever")
              hide_element(element);
              e.stopImmediatePropagation();
              })
          }
          if ($(window).width() >= 768) {
              element.addEventListener(
              "mouseover",
              () => {
                  element.classList.add("shadow", "mail");
                  element.querySelector(":scope > div > #time").style.display =
                  "none";
                  element.querySelector(
                  ":scope > div > .btn-list"
                  ).style.visibility = "visible";
              },
              false
              );
  
              element.addEventListener(
              "mouseout",
              () => {
                  element.classList.remove("shadow", "mail");
                  // $('[data-toggle="tooltip"]').tooltip('hide');
                  element.querySelector(
                  ":scope > div > .btn-list"
                  ).style.visibility = "hidden";
                  element.querySelector(":scope > div > #time").style.display =
                  "block";
              },
              false
              );
          }
          document.querySelector("#emails-view").append(element);
          });
          }
          else{
          const empty = document.createElement("div");
          empty.classList.add(
              // "row",
              "d-flex",
              "flex-column",
              "mt-5",
          );
          empty.innerHTML = `
          <div class="text-center empty_icon"><i class="far fa-folder-open"></i></div>
          <div class="text-center empty_text">Nothing in ${mailbox}</div>`
          document.querySelector("#emails-view").append(empty);
      }
          $('[data-toggle="tooltip"]').tooltip();
      })
      .catch((error) => {
          console.log(error);
      });
  }

  else{
    $(".spin").removeClass("d-flex").addClass("d-none");
    const empty = document.createElement("div");
    empty.classList.add(
        // "row",
        "d-flex",
        "flex-column",
        "mt-5",
    );
    empty.innerHTML = `
    <div class="text-center empty_text">Nothing found</div>`
    document.querySelector("#emails-view").append(empty);
}
}



async function mark_read(email, element, mailbox) {
  const mailboxExists = await fetch(`/emails/${mailbox}`, { method: 'HEAD' })
  .then(response => response.ok);
  
  if (mailboxExists){
      element.querySelector(".mark-read").addEventListener(
          "click",
          (e) => {
          let read = element.querySelector(":scope .mark-read > i");
          if (read.classList.contains("fa-envelope-open")) {
              read.classList.remove("fa-envelope-open"),
              read.classList.add("fa-envelope"),
              $(element.querySelector(".mark-read"))
                  .attr("data-original-title", "Mark as read")
                  .tooltip("show");

              element.classList.add("unread");
              // element.disabled = "disabled";
              element.classList.remove("light");

              fetch(`/emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({
                  read: false,
              }),
              });
          } else {
              read.classList.remove("fa-envelope"),
              read.classList.add("fa-envelope-open"),
              $(element.querySelector(".mark-read"))
                  .attr("data-original-title", "Mark as unread")
                  .tooltip("show");

              element.classList.add("light");
              element.classList.remove("unread");

              fetch(`/emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({
                  read: true,
              }),
              });
          }

          e.stopImmediatePropagation();
          $('[data-toggle="tooltip"]').tooltip();
          },
          false
      );
      }

  else {
      element.querySelector(".mark-read").addEventListener(
          "click",
          (e) => {
          let read = element.querySelector(":scope .mark-read > i");
          if (read.classList.contains("fa-envelope-open")) {
              read.classList.remove("fa-envelope-open"),
              read.classList.add("fa-envelope"),
              $(element.querySelector(".mark-read"))
                  .attr("data-original-title", "Mark as read")
                  .tooltip("show");

              element.classList.add("unread");
              // element.disabled = "disabled";
              element.classList.remove("light");

              fetch(`/external_emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({
                  read: false,
              }),
              });
          } else {
              read.classList.remove("fa-envelope"),
              read.classList.add("fa-envelope-open"),
              $(element.querySelector(".mark-read"))
                  .attr("data-original-title", "Mark as unread")
                  .tooltip("show");

              element.classList.add("light");
              element.classList.remove("unread");

              fetch(`/external_emails/${email.id}`, {
              method: "PUT",
              body: JSON.stringify({
                  read: true,
              }),
              });
          }

          e.stopImmediatePropagation();
          $('[data-toggle="tooltip"]').tooltip();
          },
          false
      );
      }
  }

async function mark_del(email, element, mailbox) {
  
  const ExmailboxExists = await fetch(`/external_emails/${mailbox}`, { method: 'HEAD' })
  .then(response => response.ok);

  element.querySelector(".delete").addEventListener("click", (e) => {
    if(mailbox !== "trash"){
      fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          deleted: true,
        }),
      });
      $(element.querySelector(".delete")).tooltip("hide");
      custm_alert("Conversation moved to trash")
    }
    if(mailbox !== "Exmail_trash"){
      fetch(`/emails/${email.id}`, {
        method: "PUT",
        body: JSON.stringify({
          deleted: true,
        }),
      });
      $(element.querySelector(".delete")).tooltip("hide");
      custm_alert("Conversation moved to trash")
    }
  else if (ExmailboxExists) {
    fetch(`/external_emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({
        deleted: false,
      }),
    });
    $(element.querySelector(".delete")).tooltip("hide");
    custm_alert("Conversation restored from trash")
  }
  else{
      fetch(`/emails/${email.id}`, {
      method: "PUT",
      body: JSON.stringify({
          deleted: false,
      }),
      });
      $(element.querySelector(".delete")).tooltip("hide");
      custm_alert("Conversation restored from trash")
  }
  hide_element(element);
  e.stopImmediatePropagation();
  });
}

// add email viewing to the html page
async function veiw_email(department_id, element, mailbox) {

  document.querySelector('.navbar').style.display = $(window).width() <= 768 ? "none" :"flex";
  document.querySelector("#emails-view").style.display = "none";
  document.querySelector("#compose-view").style.display = "none";
  document.querySelector("#External-view").style.display = "none";
  document.querySelector("#title").style.display = "none";
  const mailboxExists = await fetch(`/emails/${mailbox}`, { method: 'HEAD' })
  .then(response => response.ok);
  

  if (mailboxExists) {
  fetch(`/emails/${department_id}`)
    .then((response) => response.json())
    .then((email) => {
      if(email.error){
        custm_alert(email.error)
        load_mailbox(mailbox)
      }
      else{
        document.querySelector("#check-email").style.display = "block";
        document.querySelector("#External-view").style.display = "none";
        let read = element.querySelector(".mark-read > i");
  // console.log(read)
  // if(read.classList.contains("fa-envelope")){
  //   read.classList.remove("fa-envelope"),
  //     read.classList.add("fa-envelope-open"),
  //     $(element.querySelector("#check-email .mark-read"))
  //       .attr("data-original-title", "Mark as unread")
  // }

  let sender = email.username;
  let user_avatar = `<div class="sing-icon-wrapper" >
                     <span class="sing-icon rounded-circle text-white" style="background-color:${calculateColor(
                       email.sender
                     )}">${sender.charAt(0).toUpperCase()}</span>
                    </div>`;
  let sendto = email.recipients.slice(0);
  // console.log(email.recipients)
  let subject =  email.subject.length > 0 ? email.subject : "(no subject)"
  if (sendto.includes(sender)) {
    let index = sendto.indexOf(email.username);
    sendto[index] = email.sender;
  }
  // console.log(email.recipients)
  // let btn_list = element.querySelector(".btn-list").innerHTML 
  // console.log(btn_list)
      let mark_read_stat = "Mark as Unread";
      // Add a class to indicate unread email and update button text
      if (!email.read){
      document.querySelector("#check-email").innerHTML = `
        <div class="px-md-4 px-sm-0">
         <div class="action_bar bg-white">
           <span class="btn-item back-btn"><i class="fas fa-arrow-left"></i></span>  
                  
         </div>
        
          <div class="sing-detail">
          ${user_avatar}
            <div class="sing-username-wrapper">
                <div class="sing-username">
                  <p class="d-inline-block text-truncate p-0 m-0"><strong>${email.sender}</strong> </p>
                </div>
            
                <div class="dropdown">
                 <a class="dropdown-toggle text-muted h6 text-decoration-none detail-small tome" href="#" id="dropdownMenuButton" data-toggle="dropdown" data-display="static" >to ${sendto}</a>
                <div class="dropdown-menu dropdown-menu-right dropdown-menu-md-left shadow dropdown-tome" aria-labelledby="dropdownMenu2" style="top: 1rem;">
                <table class="table table-borderless my-2 detail-small">
                  <tbody>
                    <tr class="py-0">
                      <td class="text-muted text-right">From:</td>
                      <td><span class="font-weight-bold">${email.sender}</span></td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">To:</td>
                      <td>${email.recipients}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Date:</td>
                      <td>${email.timestamp}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Subject:</td>
                      <td>${subject}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Amount:</td>
                      <td>${email.amount}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Ref code:</td>
                      <td>${email.referenceCode}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
 
            <div class="sing-timestamp">
              <p class="detail-small d-inline time">${$(window).width() <= 768 ? readable_date(email.timestamp) : email.timestamp}</p>
            </div>
         
          </div>
          
          <div class="row mx-auto">
            <h4 class="sing-sub">${
              subject.toUpperCase()
            }</h4>
          </div>

          <div class="mx-auto">
            <h5 class="sing-sub">Amount: ${
             email.amount
            }</h5>
            <h5 class="sing-sub">Reference code: ${
             email.referenceCode
            }</h5>
            <br>
            <br>
            <button style="width: 25%; height:50px; border-radius:10px; background-color: rgba(130, 166, 244, 0.2); border:0;" class="btn-item read-button mark-read" title="${mark_read_stat}">Receive mail</button>
          </div>

          
          
        </div> 
      `
    }
    else if (email.read || mailbox === "sent"){
      document.querySelector("#check-email").innerHTML = `
        <div class="px-md-4 px-sm-0">
         <div class="action_bar bg-white">
           <span class="btn-item back-btn"><i class="fas fa-arrow-left"></i></span>  
                  
         </div>
        
          <div class="sing-detail">
          ${user_avatar}
            <div class="sing-username-wrapper">
                <div class="sing-username">
                  <p class="d-inline-block text-truncate p-0 m-0"><strong>${email.sender}</strong> </p>
                </div>
            
                <div class="dropdown">
                 <a class="dropdown-toggle text-muted h6 text-decoration-none detail-small tome" href="#" id="dropdownMenuButton" data-toggle="dropdown" data-display="static" >to ${sendto}</a>
                <div class="dropdown-menu dropdown-menu-right dropdown-menu-md-left shadow dropdown-tome" aria-labelledby="dropdownMenu2" style="top: 1rem;">
                <table class="table table-borderless my-2 detail-small">
                  <tbody>
                    <tr class="py-0">
                      <td class="text-muted text-right">From:</td>
                      <td><span class="font-weight-bold">${email.sender}</span></td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">To:</td>
                      <td>${email.recipients}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Date:</td>
                      <td>${email.timestamp}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Subject:</td>
                      <td>${subject}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Amount:</td>
                      <td>${email.amount}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Ref code:</td>
                      <td>${email.referenceCode}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
 
            <div class="sing-timestamp">
              <p class="detail-small d-inline time">${$(window).width() <= 768 ? readable_date(email.timestamp) : email.timestamp}</p>
            </div>
         
          </div>
          
          <div class="row mx-auto">
            <h4 class="sing-sub">${
              subject.toUpperCase()
            }</h4>
          </div>

          <div class="mx-auto">
            <h5 class="sing-sub">Amount: ${
             email.amount
            }</h5>
            <h5 class="sing-sub">Reference code: ${
             email.referenceCode
            }</h5>
          </div>

          
          
        </div> 
      `
    }
      let btn_items = document.querySelectorAll("#check-email .btn-item")
      btn_items.forEach((btn_item) => {
        btn_item.addEventListener("click", () => {
          if(mailbox.startsWith("search")){
            let [,query] = mailbox.split("/")
            history.pushState({ query: query }, "", `./#search/${query}`);
          }
          history.pushState({ mailbox: mailbox }, "", `./#${mailbox}`);

        if(btn_item.classList.contains("mark-read"))
        {
          // load_mailbox(mailbox)
          $(element.querySelector(".mark-read")).click()
          $(element.querySelector(".mark-read")).tooltip('hide')
          // setTimeout(() => { load_mailbox(mailbox)   }, 100);
        }
        
        else if(btn_item.classList.contains("delete")){
          $(element.querySelector(".delete")).click()
          // $(element.querySelector(".mark-read")).tooltip('hide')
        }
        else if(btn_item.classList.contains("del_forever")){
          $(element.querySelector(".del_forever")).click()
          // $(element.querySelector(".mark-read")).tooltip('hide')
        }
        let url = window.location.hash
        if(url.startsWith("#search")){
          let [,query] = url.split('/')
          setTimeout(() => { load_mailbox("search",query)   }, 300);
        }
        else{
          setTimeout(() => { load_mailbox(mailbox)   }, 300);
        }
        })
      })
 
      }
    });
     //   // ... do something else with email ...
    // });
}
else {
  fetch(`/external_emails/${department_id}`)
    .then((response) => response.json())
    .then((email) => {
      if(email.error){
        custm_alert(email.error)
        load_mailbox(mailbox)
      }
      else{
        document.querySelector("#check-email").style.display = "block";
        document.querySelector("#External-view").style.display = "none";
        let read = element.querySelector(".mark-read > i");
  // console.log(read)
  if(read.classList.contains("fa-envelope")){
    read.classList.remove("fa-envelope"),
      read.classList.add("fa-envelope-open"),
      $(element.querySelector("#check-email .mark-read"))
        .attr("data-original-title", "Mark as unread")
  }

  let sender = email.username;
  let user_avatar = `<div class="sing-icon-wrapper" >
                     <span class="sing-icon rounded-circle text-white" style="background-color:${calculateColor(
                       email.sender
                     )}">${sender.charAt(0).toUpperCase()}</span>
                    </div>`;
  let sendto = email.recipients.slice(0);
  // console.log(email.recipients)
  let subject =  email.subject.length > 0 ? email.subject : "(no subject)"
  if (sendto.includes(sender)) {
    let index = sendto.indexOf(email.username);
    sendto[index] = email.sender;
  }
  // console.log(email.recipients)
  // let btn_list = element.querySelector(".btn-list").innerHTML 
  // console.log(btn_list)
      document.querySelector("#check-email").innerHTML = `
        <div class="px-md-4 px-sm-0">
         <div class="action_bar bg-white">
           <span class="btn-item back-btn"><i class="fas fa-arrow-left"></i></span>  
               
         </div>
        
          

          <div class="sing-detail">
          ${user_avatar}
            <div class="sing-username-wrapper">
                <div class="sing-username">
                  <p class="d-inline-block text-truncate p-0 m-0"><strong>${email.sender}</strong> </p>
                </div>
            
                <div class="dropdown">
                 <a class="dropdown-toggle text-muted h6 text-decoration-none detail-small tome" href="#" id="dropdownMenuButton" data-toggle="dropdown" data-display="static" >to ${sendto}</a>
                <div class="dropdown-menu dropdown-menu-right dropdown-menu-md-left shadow dropdown-tome" aria-labelledby="dropdownMenu2" style="top: 1rem;">
                <table class="table table-borderless my-2 detail-small">
                  <tbody>
                    <tr class="py-0">
                      <td class="text-muted text-right">From:</td>
                      <td><span class="font-weight-bold">${email.sender}</span></td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">To:</td>
                      <td>${email.recipients}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Date:</td>
                      <td>${email.timestamp}</td>
                    </tr>
                    <tr>
                      <td class="text-muted text-right">Subject:</td>
                      <td>${subject}</td>
                    </tr>
                  </tbody>
                </table>
                </div>
              </div>
            </div>
 
            <div class="sing-timestamp">
              <p class="detail-small d-inline time">${$(window).width() <= 768 ? readable_date(email.timestamp) : email.timestamp}</p>
            </div>
         
          </div>
          
          <div class="row mx-auto">
            <h4 class="sing-sub">${
             subject
            }</h4>
          </div>
          
        </div> 
      `;
      let btn_items = document.querySelectorAll("#check-email .btn-item")
      btn_items.forEach((btn_item) => {
        btn_item.addEventListener("click", () => {
          if(mailbox.startsWith("search")){
            let [,query] = mailbox.split("/")
            history.pushState({ query: query }, "", `./#search/${query}`);
          }
          history.pushState({ mailbox: mailbox }, "", `./#${mailbox}`);

        if(btn_item.classList.contains("mark-read"))
        {
          // load_mailbox(mailbox)
          $(element.querySelector(".mark-read")).click()
          $(element.querySelector(".mark-read")).tooltip('hide')
          // setTimeout(() => { load_mailbox(mailbox)   }, 100);
        }
        
        else if(btn_item.classList.contains("delete")){
          $(element.querySelector(".delete")).click()
          // $(element.querySelector(".mark-read")).tooltip('hide')
        }
        else if(btn_item.classList.contains("del_forever")){
          $(element.querySelector(".del_forever")).click()
          // $(element.querySelector(".mark-read")).tooltip('hide')
        }
        let url = window.location.hash
        if(url.startsWith("#search")){
          let [,query] = url.split('/')
          setTimeout(() => { load_mailbox("search",query)   }, 300);
        }
        else{
          setTimeout(() => { load_mailbox(mailbox)   }, 300);
        }
        })
      })
 
      }
    });
     //   // ... do something else with email ...
    // });
}
}

// 

function custm_alert(val) {
  // $("#myToast").toast("hide");
  toastHead = document.querySelector("#head");
  toast = document.querySelector("#myToast");
  toast.classList.remove('hideToast')
  if (val.error) {
    toastHead.innerHTML = val.error;
  } else if (val.message) {
    load_mailbox("sent");
    toastHead.innerHTML = val.message;
  }
  else{
    toastHead.innerHTML = val;
  }
  $("#myToast").toast({ delay: 4000 });
  $("#myToast").toast("show");
  $('#myToast').on('hidden.bs.toast', function () {
    toast.classList.add('hideToast')
  })
  // $("#myToast").toast('dispose');
}

function readable_date(mail_date) {
  let [mail_day, mail_year, mail_time] = mail_date.split("-");
  let d = new Date();
  if (mail_year === d.getFullYear().toString()) {
    if (mail_day.split(" ")[1] === d.getDate().toString()) {
      return mail_time;
    }
    return mail_day;
  } else {
    return `${mail_day}/${mail_year}`;
  }
}
function tog_menu() {
  var targetWidth = 768;
  if ($(window).width() <= targetWidth) {
    $("#sidebar").removeClass("side_active");
    $(".main").removeClass("spread");
    $(".overlay").removeClass("over_active");
    //Add your javascript for screens wider than or equal to 768 here
  }
}

function hide_element(element) {
  $(element).addClass("fade");
  element.addEventListener("animationend", () => {
    $(element).remove();
  });
}

//Random user avatar based on email

var colors = [
  "#FFB900",
  "#D83B01",
  "#B50E0E",
  "#E81123",
  "#B4009E",
  "#5C2D91",
  "#0078D7",
  "#00B4FF",
  "#008272",
  "#107C10",
];

function calculateColor(email) {
  var sum = 0;
  for (index in email) {
    sum += email.charCodeAt(index);
  }
  // console.log(sum % colors.length)
  return colors[sum % colors.length];
}
