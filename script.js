const app_url = "https://script.google.com/macros/s/AKfycbxDLRBypiCT6eXAR_ukvG-ASZMNSf1JwR7dw0sOAoQCnoi-tPkIOp5S6dWIge2S0CcNwA/exec";

document.getElementById('rsvp-form').addEventListener('submit', function (e) {
    e.preventDefault();
    displayErrorMessage('Saving response...', '#432616');
    const submitButton = document.getElementById("submit");

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    token = urlParams.get('rsvp')

    if (token === null) {
        alert("No token specified, please use the link in your e-mail!")
        return
    }

    var attending = [];
    var starters = [];
    var mains = [];

    // Per-event RSVP: each event is an independent checkbox. The wedding is the
    // only event that drives the per-guest menu / attendance list.
    var isAttending = document.getElementById("attend-wedding").checked;
    var isNightBefore = document.getElementById("attend-night-before").checked;
    var isMorningAfter = document.getElementById("attend-morning-after").checked;
    var allergies = [];
    document.getElementsByName("allergy-guest").forEach((element) => {
        allergies.push(element.checked);
    });

    document.getElementsByName("attend-guest").forEach((element, i) => {
        attending.push(isAttending ? element.checked : false);
        var menu = getMenuItems(i);
        if (!menu & element.checked & isAttending) {
            // No menu option selected
            displayErrorMessage("Please fill in the menu selection for those attending!")
            return
        }
        starters.push(element.checked ? menu[0] : "none")
        mains.push(element.checked ? menu[1] : "none")
    });
    if (window.n_guests === 1) {
        // A menu is only required when attending the wedding dinner; a single guest
        // joining only the night-before / morning-after has no menu to pick.
        if (isAttending) {
            var menu = getMenuItems(0);
            if (!menu) {
                // No menu option selected
                displayErrorMessage("Please fill in your menu selection!")
                return
            }
            starters.push(menu[0])
            mains.push(menu[1])
        } else {
            starters.push("none")
            mains.push("none")
        }
    }

    if (starters.length < window.n_guests) {
        // No menu option was selected for one of attending guests
        // This return is called if return is called in the forEach above
        return
    }

    if (!isAttending) {
        attending.forEach((x, i) => attending[i] = false)
        starters.forEach((x, i) => starters[i] = "none")
        mains.forEach((x, i) => mains[i] = "none")
    }

    if (window.n_guests === 1) {
        attending = [isAttending];
    }

    const formData = {
        token: token,
        attending: isAttending,
        night_before: isNightBefore,
        morning_after: isMorningAfter,
        n_guests: attending.filter(Boolean).length,
        attend_list: attending.join(', '),
        has_allergies: allergies.join(', '),
        starter: starters.join(', ').toLowerCase(),
        mains: mains.join(', ').toLowerCase(),
    };

    submitButton.textContent = "Submitting...";

    // Making a POST request with the form data
    fetch(app_url, {
        method: 'POST',
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(formData),
        credentials: 'omit',
    })
        .then(response => response.json()) // Parsing the JSON response
        .then(data => {
            // Handle response data
            if (data.status === "response_saved") {
                submitButton.textContent = "Response saved!";
                setTimeout(function () {
                    $('#submit').text("Update RSVP");
                }, 2000);
                displayErrorMessage('Thank you, your response has been recorded!', 'green');
            } else {
                displayErrorMessage('Unknown token! Please contact us if you believe this is an error!');
                submitButton.textContent = "Unknown token!";
                submitButton.disabled = true;
            }
            // Optionally, reset the form or redirect the user
        })
        .catch(error => {
            // Handling any errors that occur during the fetch operation
            console.error('Error submitting form:', error);
            displayErrorMessage("An error occurred while submitting your RSVP. Please try again. If the issue persists please contact Natasha or Fabian!");
            submitButton.textContent = "Error!";
            setTimeout(function () {
                $('#submit').text("Submit");
            }, 5000);
        });
});

function submitSong() {    // Making a POST request with the form data
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    var token = urlParams.get('rsvp');
    var song = $('#song-name').val();
    if (song === "") { return; }
    $('#song-status').text('Submitting...');
    $('#submit-song').prop('disabled', true);

    const formData = {
        token: token,
        song: song,
    };

    fetch(app_url, {
        method: 'POST',
        headers: {
            "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(formData),
        credentials: 'omit',
    })
        .then(response => response.json()) // Parsing the JSON response
        .then(data => {
            // Handle response data
            if (data.status === "song_added") {
                $('#song-name').val('');
                $('#song-status').text('Song added!');
                $('#submit-song').prop('disabled', false);
                setTimeout(function () {
                    $('#song-status').text('You can submit up to 10 songs.');
                }, 2000);
            } else if (data.status === "max_songs_reached") {
                $('#song-status').text('Max songs reached!');
            } else {
                $('#song-status').text('Invalid rsvp token! You need one to submit songs.');
            }
            // Optionally, reset the form or redirect the user
        })
        .catch(error => {
            // Handling any errors that occur during the fetch operation
            console.error('Error submitting song:', error);
            $('#song-status').text('Error submitting song, please try again...');
            setTimeout(function () {
                $('#submit-song').prop('disabled', false);
                $('#song-status').text("You can submit up to 10 songs.");
            }, 5000);
        });
}

// Function to fetch recipient name using the token
function fetchRecipientName() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    var url = `${app_url}`

    // Constructing the URL with the token
    if (urlParams.has('rsvp')) {
        var url = `${app_url}?token=${urlParams.get('rsvp')}`;
    }

    // Performing the GET request
    fetch(url, {
        method: 'GET',
        credentials: 'omit'
    })
        .then(response => response.json()) // Parsing the JSON response
        .then(data => {
            if (data.status === 'valid_token') {
                $('#rsvp-loading').hide();
                $('#rsvp-public-message').hide();

                // Displaying the recipient name if the token is valid
                const guests = data.name.split(', ');
                window.n_guests = guests.length;
                displayGuestList(guests, data);

                // Add secret location
                $('#loc_1').text(data.location_1);
                $('#loc_2').text(data.location_2);
                $('#popup-location').text(data.location_2);

                setupMapLocations(data.locations);
            } else if (data.status === 'bad_token') {
                console.error("Invalid token");

                $('#loc_2').text("Please use the correct rsvp token to reveal the location.");
                $('#rsvp-loading').text('Invalid RSVP link. Please use the link provided with your invitation.');
                $('#rsvp-public-message').show();

                alert("Invalid rsvp token provided. Please check and try again.");
            } else if (data.status === 'no_token') {
                $('#loc_2').text("Please specify an rsvp token to reveal the location.");
                $('#rsvp-loading').text('Please use the RSVP link provided with your invitation.');
                $('#rsvp-public-message').show();
            }
        })
        .catch(error => {
            // Handling any errors that occur during the fetch operation
            console.error('Error fetching recipient info:', error);
            alert("An error occurred while fetching the recipient name.");
        });
}

// Function to display the recipient name
function displayRecipientName(name) {
    const rsvpSection = document.getElementById('rsvp');
    const nameElement = document.createElement('h2');
    nameElement.textContent = `RSVP for ${name}`;
    rsvpSection.prepend(nameElement); // Adding the name at the beginning of the RSVP section
    rsvpSection.classList.remove("hidden")
}

function concatenateNames(names) {
    // Allow popping without affecting `names`
    var tempNames = names.slice();
    if (tempNames.length === 1) {
        return tempNames[0];
    } else {
        const last = tempNames.pop();
        return tempNames.join(', ') + ' & ' + last;
    }
}

function camelize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

function getMenuItems(index) {
    const starters = document.querySelector(`input[name="starter-${index}"]:checked`);
    const mains = document.querySelector(`input[name="main-${index}"]:checked`);
    if (!starters | !mains) {
        return false;
    }
    return [starters.value, mains.value]
}

function checkChanged(checkedCheckbox) {
    const submitButton = document.getElementById("submit");
    // Per-event RSVP: three independent event checkboxes ("attend-event") plus a
    // mutually-exclusive "can't make it" box ("attend-no").
    const eventBoxes = document.querySelectorAll('input[name="attend-event"]');
    const noBox = document.getElementById("attend-no");

    if (checkedCheckbox === noBox && noBox.checked) {
        // "Can't make it" clears every event selection.
        eventBoxes.forEach((cb) => cb.checked = false);
    } else if (checkedCheckbox !== noBox && checkedCheckbox.checked) {
        // Selecting any event clears "can't make it".
        noBox.checked = false;
    }

    var anyEvent = false;
    eventBoxes.forEach((cb) => anyEvent = (anyEvent | cb.checked));

    // Only the wedding drives the per-guest menu / attendance section.
    const isWedding = document.getElementById("attend-wedding").checked;
    if (isWedding) {
        showAttend(window.n_guests > 1 ? 'multi-attend' : 'normal-attend');
    } else {
        hideAttend('multi-attend');
        hideAttend('normal-attend');
    }

    if (!anyEvent && !noBox.checked) {
        submitButton.disabled = true;
        submitButton.textContent = 'Please select a response!';
        return;
    }

    if (noBox.checked) {
        submitButton.disabled = false;
        submitButton.textContent = "Submit response, we'll miss you!";
        return;
    }

    if (isWedding) {
        var attendList = [];
        document.getElementsByName("attend-guest").forEach((element) => attendList.push(element.checked));
        var n_guests = window.n_guests === 1 ? 1 : attendList.filter(Boolean).length;
        if (n_guests > 0) {
            if (window.n_guests > 1) {
                submitButton.textContent = `${window.responded ? 'Update ' : ''} RSVP for ${n_guests} guest${n_guests > 1 ? 's' : ''}`;
            } else {
                submitButton.textContent = window.responded ? "Update RSVP" : "RSVP";
            }
            submitButton.disabled = false;
        } else {
            submitButton.textContent = 'Cannot RSVP with no guests!';
            submitButton.disabled = true;
        }
    } else {
        // Attending other events but not the wedding dinner — no menu required.
        submitButton.textContent = window.responded ? "Update RSVP" : "Submit RSVP";
        submitButton.disabled = false;
    }
}

function displayGuestList(guestNames, data) {
    const submitButton = document.getElementById("submit")
    const rsvpSection = document.getElementById('rsvp');
    const rsvpIntroNames = document.getElementById("rsvp-guest-names");
    rsvpIntroNames.textContent = concatenateNames(guestNames);

    window.responded = data.responded === true;

    if (guestNames.length === 1) {
        const guestElement = document.createElement('div');
        guestElement.classList.add('guest-element')

        var index = 0
        guestElement.innerHTML = `
        <div class="guest-element-menu">
            <div class="sub-menu">
                <b>Entrée</b><br>
                <input type="radio" id="starter-springbok-${index}" name="starter-${index}" value="springbok">
                <label for="starter-springbok-${index}">Springbok Carpaccio</label><br>
                <input type="radio" id="starter-crumpet-${index}" name="starter-${index}" value="crumpet">
                <label for="starter-crumpet-${index}">Bloody Mary Crumpets</label><br>
                <input type="radio" id="starter-tartlet-${index}" name="starter-${index}" value="tartlet">
                <label for="starter-tartlet-${index}">Puff Pastry Tartlets (V)</label><br>
            </div>
            <div class="sub-menu">
                <b>Mains</b><br>
                <input type="radio" id="main-salmon-${index}" name="main-${index}" value="salmon">
                <label for="main-salmon-${index}">Norwegian Salmon</label><br>
                <input type="radio" id="main-pork-${index}" name="main-${index}" value="pork">
                <label for="main-pork-${index}">Slow Roasted Pork Belly</label><br>
                <input type="radio" id="main-phyllo-${index}" name="main-${index}" value="phyllo">
                <label for="main-phyllo-${index}">Phyllo Pocket <span class="green">(V)</span></label><br>
            </div>
        </div>
        <div class="checkbox-container allergy-checkbox">
            <input type="checkbox" id="allergy-${index}" name="allergy-guest" hidden></input>
            <label for="allergy-${index}" class="custom-checkbox custom-checkbox-nocover"></label>
            <span class="custom-checkbox-label">Dietary requirements / allergies</span>
        </div>
        `

        document.getElementById("normal-attend").appendChild(guestElement);

        if (data.responded) {
            // Logic for updating sections with responses
            document.getElementsByName(`starter-${index}`).forEach((element, _) => {
                var starter = String(data.starter).split(', ')[index];
                element.checked = element.value === starter;
                element.disabled = data.locked;
            })
            document.getElementsByName(`main-${index}`).forEach((element, _) => {
                var mains = String(data.mains).split(', ')[index];
                element.checked = element.value === mains;
                element.disabled = data.locked;
            })
        }
    } else {
        document.getElementsByName("attend-pron").forEach((element, _) => {
            element.textContent = "We";
        });

        guestNames.forEach((name, index) => {
            const guestElement = document.createElement('div');
            guestElement.classList.add('guest-element')

            guestElement.innerHTML = `
            <div class="guest-element-header">
                <b>${name}</b>
                <div class="checkbox-container guest-checkbox">
                    <span class="custom-checkbox-label">Attending:</span>
                    <input type="checkbox" id="attend-${index}" name="attend-guest" hidden checked></input>
                    <label for="attend-${index}" class="custom-checkbox custom-checkbox-nocover"></label>
                </div>
            </div>
            <div class="guest-element-menu">
                <div class="sub-menu">
                    <b>Entrée</b><br>
                    <input type="radio" id="starter-springbok-${index}" name="starter-${index}" value="springbok">
                    <label for="starter-springbok-${index}">Springbok Carpaccio</label><br>
                    <input type="radio" id="starter-crumpet-${index}" name="starter-${index}" value="crumpet">
                    <label for="starter-crumpet-${index}">Bloody Mary Crumpets</label><br>
                    <input type="radio" id="starter-tartlet-${index}" name="starter-${index}" value="tartlet">
                    <label for="starter-tartlet-${index}">Puff Pastry Tartlets <span class="green">(V)</span></label><br>
                </div>
                <div class="sub-menu">
                    <b>Mains</b><br>
                    <input type="radio" id="main-salmon-${index}" name="main-${index}" value="salmon">
                    <label for="main-salmon-${index}">Norwegian Salmon</label><br>
                    <input type="radio" id="main-pork-${index}" name="main-${index}" value="pork">
                    <label for="main-pork-${index}">Slow Roasted Pork Belly</label><br>
                    <input type="radio" id="main-phyllo-${index}" name="main-${index}" value="phyllo">
                    <label for="main-phyllo-${index}">Phyllo Pocket <span class="green">(V)</span></label><br>
                </div>
            </div>
            <div class="checkbox-container allergy-checkbox">
                <input type="checkbox" id="allergy-${index}" name="allergy-guest" hidden></input>
                <label for="allergy-${index}" class="custom-checkbox custom-checkbox-nocover"></label>
                <span class="custom-checkbox-label">Dietary requirements / allergies</span>
            </div>
            `;

            document.getElementById("multi-attend").appendChild(guestElement);

            checkbox = document.getElementById(`attend-${index}`)
            checkbox.disabled = data.locked;
            checkbox.addEventListener('change', function () {
                document.getElementsByName(`starter-${index}`).forEach((element, _) => {
                    element.disabled = !this.checked;
                })
                document.getElementsByName(`main-${index}`).forEach((element, _) => {
                    element.disabled = !this.checked;
                })
                var allergyBox = document.getElementById(`allergy-${index}`);
                if (allergyBox) allergyBox.disabled = !this.checked;
                var attendList = [];
                document.getElementsByName("attend-guest").forEach((element, i) => attendList.push(element.checked));
                var n_guests = attendList.filter(Boolean).length;
                if (n_guests > 0) {
                    submitButton.textContent = `${window.responded ? 'Update ' : ''} RSVP for ${n_guests} guest${n_guests > 1 ? 's' : ''}`;
                    submitButton.disabled = false;
                } else {
                    submitButton.textContent = 'Cannot RSVP with no guests!';
                    submitButton.disabled = true;
                }
            });

            if (data.responded) {
                // Logic for updating sections with responses
                checkbox.checked = String(data.attend_list).split(', ')[index] === 'true'
                document.getElementsByName(`starter-${index}`).forEach((element, _) => {
                    var starter = String(data.starter).split(', ')[index];
                    element.checked = element.value === starter;
                    element.disabled = !checkbox.checked | data.locked;
                })
                document.getElementsByName(`main-${index}`).forEach((element, _) => {
                    var mains = String(data.mains).split(', ')[index];
                    element.checked = element.value === mains;
                    element.disabled = !checkbox.checked | data.locked;
                })
                var allergyBox = document.getElementById(`allergy-${index}`);
                if (allergyBox) allergyBox.disabled = !checkbox.checked | data.locked;
            }
        });
    }

    // Appending the guest list element to the RSVP section
    rsvpSection.hidden = false

    const attendNightBefore = document.getElementById("attend-night-before");
    const attendWedding = document.getElementById("attend-wedding");
    const attendMorningAfter = document.getElementById("attend-morning-after");
    const attendNo = document.getElementById("attend-no");

    if (data.responded) {
        submitButton.disabled = data.locked
        // Restore each event independently from its own boolean.
        attendWedding.checked = data.attending === true;
        attendNightBefore.checked = data.night_before === true;
        attendMorningAfter.checked = data.morning_after === true;
        var anyEvent = attendWedding.checked || attendNightBefore.checked || attendMorningAfter.checked;
        if (attendWedding.checked) {
            showAttend(guestNames.length > 1 ? 'multi-attend' : 'normal-attend');
        }
        if (!anyEvent) {
            attendNo.checked = true;
        }
        attendNightBefore.disabled = data.locked;
        attendWedding.disabled = data.locked;
        attendMorningAfter.disabled = data.locked;
        attendNo.disabled = data.locked;
        var allergyList = String(data.has_allergies).split(', ');
        document.getElementsByName("allergy-guest").forEach((element, i) => {
            element.checked = allergyList[i] === 'true';
            element.disabled = data.locked;
        });
        if (!data.locked) {
            var n_attending = String(data.attend_list).split(', ').filter((x) => x === 'true').length;
            if (window.n_guests > 1 && attendWedding.checked) {
                submitButton.textContent = `Update RSVP for ${n_attending} guest${n_attending !== 1 ? 's' : ''}`;
            } else {
                submitButton.textContent = "Update RSVP"
            }
            displayErrorMessage('We already have your response on record, but feel free to update it!', '#432616');
        }
    }
    if (data.locked) {
        submitButton.textContent = "Response locked"
        displayErrorMessage('Your responses have been locked, please contact Natasha or Fabian \nif you need to make changes!', '#432616');
    }
}

function addAccomodation(location) {
    const accomodationElement = document.createElement('div');
    accomodationElement.classList.add('accomodation');

    accomodationElement.innerHTML = `
    <img src="${location.img_url}">
    <div>
        <h3>${location.title}</h3>
        ${location.description}<br>
        <a href="${location.href}" target="_blank">${location.location}</a>
    </div>
    `;

    document.getElementById("offsite-accommodation-list").appendChild(accomodationElement);
}

function showAttend(id) {
    $(`#${id}`).show()
    $(`#${id}`).css('opacity', 0)
    setTimeout(function () {
        $(`#${id}`).css('opacity', 1)
    }, 10);
}

function hideAttend(id) {
    $(`#${id}`).css('opacity', 0)
    setTimeout(function () {
        $(`#${id}`).hide()
    }, 200);
}

// Function to display error messages
function displayErrorMessage(message, color = 'red') {
    const errorElement = document.getElementById("rsvp-error");
    errorElement.style.color = color;
    errorElement.textContent = message;
    errorElement.hidden = false
}

function hideErrorMessage() {
    const errorElement = document.getElementById("rsvp-error")
    errorElement.hidden = true
}

function isOnlyWhitespaceAndNewlines(str) {
    return /^[\s\n]*$/.test(str);
}

var n = 0;
function wrapTextWithSpans(element) {
    const nodes = element.childNodes;

    nodes.forEach(node => {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.nodeValue;
            if (!isOnlyWhitespaceAndNewlines(text)) {
                const spanText = Array.from(text).map(char => {
                    if (isOnlyWhitespaceAndNewlines(char)) {
                        return char
                    }
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.style.animationDelay = (Math.random() * 0.2 + (n) * 0.05) + 's';
                    n = n + 1 - n / 100
                    return span.outerHTML;
                }).join('');
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = spanText;
                while (tempDiv.firstChild) {
                    element.insertBefore(tempDiv.firstChild, node);
                }
                element.removeChild(node);
            }
        } else if (node.nodeType === Node.ELEMENT_NODE) {
            wrapTextWithSpans(node);
        }
    });
}

var map = null;
function setupMap() {
    zoom = window.innerWidth < 460 ? 11 : 13;
    // Initialize the map with the specified view
    map = L.map('map', {
        scrollWheelZoom: L.Browser.mobile,
        dragging: !L.Browser.mobile,
    }).setView([-33.291373, 19.1140692], zoom);

    // Add CartoDB Positron tile layer
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        maxZoom: 19
    }).addTo(map);
}

function setupMapLocations(locations) {
    // Define locations to pin

    // Add markers and labels to the map
    locations.forEach(function (location) {
        let shiftIcon = (location.colour === "blue");
        var mapIcon = new L.Icon({
            iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${location.colour}.png`,
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: shiftIcon ? [17, 30] : [25, 41],
            iconAnchor: shiftIcon ? [8, 41] : [12, 41],
            popupAnchor: [1, -34],
            shadowSize: shiftIcon ? [30, 30] : [41, 41]
        });

        var marker = L.marker([location.lat, location.lng], { icon: mapIcon }).addTo(map)

        var label = L.divIcon({
            className: (shiftIcon & L.Browser.mobile) ? 'map-label-small' : 'map-label',
            html: `<a href="${location.href}" target="_blank">${location.title}</a>`,
            iconSize: [100, 10],
            iconAnchor: [50, 55]
        });

        L.marker([location.lat, location.lng], { icon: label }).addTo(map);

        if (location.gpx !== "") {
            var gpxLayer = omnivore.gpx.parse(location.gpx);
            gpxLayer.on('ready', function () {
                map.fitBounds(gpxLayer.getBounds());
            });
            gpxLayer.addTo(map);
        }

        if (location.listed) {
            addAccomodation(location);
        }
    });

    if (locations.length > 0) {
        var bounds = L.latLngBounds(locations.map(function (l) { return [l.lat, l.lng]; }));
        map.fitBounds(bounds, { padding: [30, 30] });
        map.once('moveend', function () {
            map.setZoom(map.getZoom());
        });
    }
}

function closeInvitation() {
    $('#popup').addClass('transition');
    $('#popup').css('top', '130%');
    $('#overlay').css('opacity', '0');
    $('body').removeClass('noscroll');

    setTimeout(function () {
        $('#popup').hide();
        $('#overlay').hide();
    }, 500);
}

function closeAllPopup() {
    $('#popup').addClass('transition');
    $('#popup').css('opacity', '0');
    $('#overlay').css('opacity', '0');
    $('#music').css('opacity', '0');
    $('body').removeClass('noscroll')
    $('#overlay').click(null);
    setTimeout(function () {
        $('#popup').hide();
        $('#overlay').hide();
        $('#music').hide();
    }, 500);
}

function openMusic() {
    $('#overlay').show()
    $('#music').show()
    $('#music').css('opacity', '0');
    $('#overlay').css('opacity', '0.7');
    $('#overlay').click(closeAllPopup);
    setTimeout(function () {
        $(`#music`).css('opacity', 1)
    }, 10);
}

function openInvitation() {
    $('#asset-invite').addClass('open');
    $('#overlay').click(null);

    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const token = urlParams.get('rsvp');

    if (!token) {
        $('#popup-location').text('Location available with a valid RSVP link.');
        return;
    }

    fetch(`${app_url}?token=${encodeURIComponent(token)}`, {
        method: 'GET',
        credentials: 'omit'
    })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'valid_token') {
                $('#popup-location').text(data.location_2);
            } else {
                $('#popup-location').text('Location available with a valid RSVP link.');
            }
        })
        .catch(error => {
            console.error('Error fetching invitation location:', error);
            $('#popup-location').text('Location could not be loaded. Please try again.');
        });
}

$(document).ready(function () {
    $('body').addClass('noscroll');

    $('.view-more').click(closeInvitation);
    $('.close').click(closeAllPopup);
    $('#wax-seal').click(openInvitation);
    $('#overlay').click(openInvitation);
    $('.music-nav-button').click(openMusic);
    $('#submit-song').click(submitSong);

    $('#nav-toggle').click(function () {
        $('.nav-links').toggleClass('open');
    });

    $('.nav-links a').click(function () {
        $('.nav-links').removeClass('open');
    });

    setupMap();
});

document.addEventListener('DOMContentLoaded', function () {
    fetchRecipientName();
});

window.onscroll = function () {
    var navbar = document.getElementById("navbar");
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;

    if (scrollTop > 50) {
        navbar.style.background = "rgba(211, 193, 165, .88)";
    } else {
        navbar.style.background = "";
    }
};
