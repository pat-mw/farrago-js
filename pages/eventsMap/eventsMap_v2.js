// import tube maps geojson

// Replace with your own Mapbox access token
mapboxgl.accessToken =
    "pk.eyJ1IjoiZmFycmFnbyIsImEiOiJjbGtuNW45dXYwazN6M2VwbGZ3aXRrdm9jIn0.lq66B9IqTWnxWKmP0LsYDg";

// Define the locations of the easter eggs
const CHICHENITZA = [-88.5710518, 20.6809718];
const EIFFEL = [2.2896104, 48.8583735];
const GREAT_PYRAMID = [31.1316297, 29.9791751];
const COLOSSEUM = [12.489656, 41.8902142];

// Define the easter egg phrases and locations
const EASTER_EGG_PHRASES = {
    tacos: CHICHENITZA,
    croissant: EIFFEL,
    pizza: COLOSSEUM,
    builtbyaliens: GREAT_PYRAMID,
};

// Create the global map object
let map;
let events;

const GEOJSON_LAYER_SOURCES = {
    tubeStations: {
        type: "geojson",
        // Use a URL for the value for the `data` property.
        data: "https://cdn.jsdelivr.net/gh/pat-mw/farrago-js/data/tubemaps.json",
    },
};

// Get the location data from the displayed elements
const getEventData = () => {
    const eventElements = document.querySelectorAll("#location-data .location");
    const events = [];

    eventElements.forEach((element) => {
        const id = element.getAttribute("data-id");
        // TODO: add google maps link in UI
        const locationUrl = element.getAttribute("data-locationUrl");

        // TODO: fetch event tags using attributes
        // search children for tags
        const tagEls = element.querySelectorAll("[data-tag]");

        // get tag values
        const tags = [];
        tagEls.forEach((el) => {
            tags.push(el.getAttribute("data-tag"));
        });
        const eventEl = element;
        const name = element.getAttribute("data-name");
        const address = element.getAttribute("data-address");
        const bio = element.getAttribute("data-bio");
        const date = element.getAttribute("data-date");
        const lat = element.getAttribute("data-lat");
        const lng = element.getAttribute("data-lng");

        // const linkTicketsEl = element.querySelector("[data-link-tickets]");
        // const linkInfoEl = element.querySelector("[data-link-info]");
        const linkEl = element.querySelector("[data-link]");
        const linkTickets = element.querySelector("[data-link]").getAttribute("data-link");
        const linkInfo = element.querySelector("[data-link-info]").getAttribute("href");

        // Getting the image from child with attribute data-img
        const image = element.querySelector("[data-img]").getAttribute("src");

        if (!isNaN(lat) && !isNaN(lng) && lat !== "" && lng !== "") {
            const event = {
                eventEl,
                id,
                lat,
                lng,
                name,
                address,
                image,
                bio,
                date,
                linkEl,
                linkInfo,
                linkTickets,
                tags,
            };
            events.push(event);
        }
    });

    return events;
};

function getEventsMapBounds(events) {
    let defaultMapBounds = [
        [events[0].lng, events[0].lat],
        [events[0].lng, events[0].lat],
    ];
    // Proceduraly find the bounds of the map by iterating over the events
    events.forEach((event) => {
        defaultMapBounds[0][0] = Math.min(defaultMapBounds[0][0], event.lng);
        defaultMapBounds[0][1] = Math.min(defaultMapBounds[0][1], event.lat);
        defaultMapBounds[1][0] = Math.max(defaultMapBounds[1][0], event.lng);
        defaultMapBounds[1][1] = Math.max(defaultMapBounds[1][1], event.lat);
    });

    return defaultMapBounds;
}

function getUsersLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(showPosition);
    } else {
        x.innerHTML = "Geolocation is not supported by this browser.";
    }
}

function showPosition(position) {
    console.log(
        "Latitude: " +
            position.coords.latitude +
            "<br>Longitude: " +
            position.coords.longitude
    );

    // Add a marker to the map
    var marker = new mapboxgl.Marker()
        .setLngLat([position.coords.longitude, position.coords.latitude])
        .addTo(map)
        .setPopup(
            new mapboxgl.Popup().setHTML(
                "<h1>Current Location</h1><p>You are here!</p>"
            )
        );
}

// Initialize the map
const initializeMap = () => {
    events = getEventData();

    const eventsBounds = getEventsMapBounds(events);
    map = new mapboxgl.Map({
        container: "map",
        // style: "mapbox://styles/farrago/clkn624w100kp01pc3gu6eryr",
        style: "mapbox://styles/farrago/clw1bds4q021z01o0e98rfaxs",
        // pitch: 45,
        // center: [events[0].lng, events[0].lat],
        // zoom: 12,
        maxZoom: 16,
        minZoom: 10,
        maxBounds: eventsBounds,
    });

    // ---- ADD TUBE STATIONS GEOJSON -----
    // map.on("load", () => {
    //     map.addSource("tube-stations", GEOJSON_LAYER_SOURCES.tubeStations);

    //     map.addLayer({
    //         id: "tube-stations-layer",
    //         type: "circle",
    //         source: "tube-stations",
    //         paint: {
    //             "circle-radius": 5,
    //             "circle-stroke-width": 3,
    //             "circle-color": "white",
    //             "circle-stroke-color": "white",
    //         },
    //     });
    // });

    $(".map-overlay-layer").hide();
    const btnResetMapEl = document.querySelector("[btn-reset-map]");

    if (events.length === 0) {
        console.error("No events with valid locations found.");
        return;
    } else {
        console.log(`Found ${events.length} events with valid locations.`);
    }

    map.touchZoomRotate.enable();

    const setMaxBounds = () => {
        map.fitBounds(eventsBounds, { padding: 200 });
    };

    const setInitialBounds = () => {
        map.fitBounds(eventsBounds, { padding: 130 });
    };

    setInitialBounds();

    btnResetMapEl.addEventListener("click", (e) => {
        e.preventDefault();
        setMaxBounds();
    });

    map.addControl(new mapboxgl.NavigationControl(), "bottom-left");

    let selectedEvent = null;
    events.forEach((event) => {
        try {
            const markerElement = document.createElement("div");
            console.log("Event tags: ", event.tags);
            if (event.tags.includes("Farrago Feature")) {
                markerElement.classList.add("marker", "is-farrago-featured");
                const imgElement = document.createElement("img");
                imgElement.classList.add("marker-map-logo");
                imgElement.src = "https://cdn.prod.website-files.com/6358e991f1dde9bcc1825b59/6358f48c0f7983bc1111541b_logo-white.png";
                imgElement.setAttribute("loading", "lazy");
                imgElement.setAttribute("sizes", "48px");
                imgElement.setAttribute("alt", event.name);
                imgElement.setAttribute("srcset", "https://cdn.prod.website-files.com/6358e991f1dde9bcc1825b59/6358f48c0f7983bc1111541b_logo-white-p-500.png 500w, https://cdn.prod.website-files.com/6358e991f1dde9bcc1825b59/6358f48c0f7983bc1111541b_logo-white-p-800.png 800w, https://cdn.prod.website-files.com/6358e991f1dde9bcc1825b59/6358f48c0f7983bc1111541b_logo-white-p-1080.png 1080w, https://cdn.prod.website-files.com/6358e991f1dde9bcc1825b59/6358f48c0f7983bc1111541b_logo-white-p-1600.png 1600w, https://cdn.prod.website-files.com/6358e991f1dde9bcc1825b59/6358f48c0f7983bc1111541b_logo-white.png 1920w");
                markerElement.appendChild(imgElement);
            } else {
                markerElement.classList.add("marker");
            }

            const deselectEvent = () => {
                if (selectedEvent) {
                    selectedEvent.classList.remove("selected");
                    selectedEvent = null;
                }
            };
            const selectEvent = (event) => {
                if (event) {
                    deselectEvent(selectedEvent);

                    let currentSelectedParent = event.linkEl.parentNode;
                    currentSelectedParent.classList.add("selected");

                    selectedEvent = currentSelectedParent; // Update the selected event

                    event.eventEl.scrollIntoView({
                        behavior: "smooth",
                        block: "nearest",
                        inline: "start",
                    });
                } else {
                    deselectEvent();
                    setInitialBounds();
                }
            };

            markerElement.addEventListener("click", () => {
                setTimeout(() => {
                    // Delay the select event until after the current thread
                    console.log("Marker clicked: ", event);
                    map.flyTo({
                        center: [event.lng, event.lat],
                        zoom: 16,
                        pitch: 70,
                    });
                    selectEvent(event);
                }, 0);
            });

            event.linkEl.addEventListener("click", (e) => {
                e.preventDefault();
                markerElement.click();
                selectEvent(event);
            });

            const onPopupClose = () => {
                console.log("Popup closed");
                selectEvent(null);
            };

            const popup = getPopup(event, onPopupClose);

            const marker = new mapboxgl.Marker({
                element: markerElement,
                anchor: "right", // Set the anchor point to right
            })
                .setLngLat([event.lng, event.lat])
                .setPopup(popup)
                .addTo(map);
        } catch (error) {
            console.error(
                "An error occurred while creating the marker:",
                error
            );
        }
    });

    // getUsersLocation
    getUsersLocation();

    // ----------------- EASTER EGG -----------------

    let keysPressed = "";

    window.addEventListener("keypress", (e) => {
        // Add the key pressed by the user to the keysPressed string
        keysPressed += e.key;

        // Iterate over the EASTER_EGG_PHRASES object
        for (let phrase in EASTER_EGG_PHRASES) {
            // Check if the keysPressed string ends with the current phrase
            if (keysPressed.endsWith(phrase)) {
                map.setMaxBounds(null);
                map.setMinZoom(1);
                // If it does, set the map's location to the corresponding location
                map.flyTo({
                    center: EASTER_EGG_PHRASES[phrase],
                    zoom: 16,
                    pitch: 70,
                });

                // Reset the keysPressed string
                keysPressed = "";
                break;
            }
        }
    });
};

// Create a popup for the marker
const getPopup = (event, onPopupClose) => {
    const popup = new mapboxgl.Popup({
        offset: 100,
        anchor: "right",
        closeButton: false,
    }).setHTML(`
        <div class="mapbox-popup-component">
            <div class="mapboxgl-popup-card-test">
                <h6 data-date="" class="heading-9">${event.date}</h6>
                <div class="mapboxgl-popup-content">
                    <div class="tooltip2_card-wrapper">
                        <h6 data-name="">${event.name}</h6>
                        <div class="tooltip2_image-wrapper">
                            <img
                                src="${event.image}"
                                loading="lazy"
                                data-img=""
                                alt=""
                                class="tooltip2_image"
                            />
                        </div>
                        <div class="margin-top-25 margin-xxsmall">
                            <div class="button-group is-center">
                                <a
                                    data-link-tickets=""
                                    href="${event.linkTickets}"
                                    class="button is-icon is-link is-alternate w-inline-block"
                                    target="_blank"
                                >
                                    <div>Tickets</div>
                                    <div class="icon-embed-xxsmall-29 w-embed">
                                        <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        xmlns:xlink="http://www.w3.org/1999/xlink"
                                        aria-hidden="true"
                                        role="img"
                                        class="iconify iconify--heroicons"
                                        width="100%"
                                        height="100%"
                                        preserveAspectRatio="xMidYMid meet"
                                        viewBox="0 0 24 24"
                                        >
                                            <path
                                                fill="currentColor"
                                                fill-rule="evenodd"
                                                d="M1.5 6.375c0-1.036.84-1.875 1.875-1.875h17.25c1.035 0 1.875.84 1.875 1.875v3.026a.75.75 0 0 1-.375.65a2.249 2.249 0 0 0 0 3.898a.75.75 0 0 1 .375.65v3.026c0 1.035-.84 1.875-1.875 1.875H3.375A1.875 1.875 0 0 1 1.5 17.625v-3.026a.75.75 0 0 1 .374-.65a2.249 2.249 0 0 0 0-3.898a.75.75 0 0 1-.374-.65zm15-1.125a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0V6a.75.75 0 0 1 .75-.75m.75 4.5a.75.75 0 0 0-1.5 0v.75a.75.75 0 0 0 1.5 0zm-.75 3a.75.75 0 0 1 .75.75v.75a.75.75 0 0 1-1.5 0v-.75a.75.75 0 0 1 .75-.75m.75 4.5a.75.75 0 0 0-1.5 0V18a.75.75 0 0 0 1.5 0zM6 12a.75.75 0 0 1 .75-.75H12a.75.75 0 0 1 0 1.5H6.75A.75.75 0 0 1 6 12m.75 2.25a.75.75 0 0 0 0 1.5h3a.75.75 0 0 0 0-1.5z"
                                                clip-rule="evenodd"
                                            ></path>
                                        </svg>
                                    </div>
                                </a>
                                <a
                                    data-link-info=""
                                    href="${event.linkInfo}"
                                    class="button is-icon is-link is-alternate is-right w-inline-block"
                                    target="_blank"
                                >
                                    <div>Info</div>
                                    <div class="icon-embed-xxsmall-30 w-embed">
                                        <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        xmlns:xlink="http://www.w3.org/1999/xlink"
                                        aria-hidden="true"
                                        role="img"
                                        class="iconify iconify--heroicons"
                                        width="100%"
                                        height="100%"
                                        preserveAspectRatio="xMidYMid meet"
                                        viewBox="0 0 20 20"
                                        >
                                            <path
                                                fill="currentColor"
                                                fill-rule="evenodd"
                                                d="M18 10a8 8 0 1 1-16 0a8 8 0 0 1 16 0m-7-4a1 1 0 1 1-2 0a1 1 0 0 1 2 0M9 9a.75.75 0 0 0 0 1.5h.253a.25.25 0 0 1 .244.304l-.459 2.066A1.75 1.75 0 0 0 10.747 15H11a.75.75 0 0 0 0-1.5h-.253a.25.25 0 0 1-.244-.304l.459-2.066A1.75 1.75 0 0 0 9.253 9z"
                                                clip-rule="evenodd"
                                            ></path>
                                        </svg>
                                    </div>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
                <h6 data-address="" class="heading-10">${event.address}</h6>
            </div>
        </div>
    `);

    if (onPopupClose) {
        popup.on("close", (e) => {
            onPopupClose();
        });
    }
    return popup;
};

initializeMap();
