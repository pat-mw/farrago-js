// Replace with your own Mapbox access token
mapboxgl.accessToken =
    "pk.eyJ1IjoiZmFycmFnbyIsImEiOiJjbGtuNW45dXYwazN6M2VwbGZ3aXRrdm9jIn0.lq66B9IqTWnxWKmP0LsYDg";

// Define the locations of the easter eggs
const CHICHENITZA = [-88.5710518, 20.6809718];
const EIFFEL = [2.2896104, 48.8583735] ;
const GREAT_PYRAMID = [31.1316297, 29.9791751];
const COLOSSEUM = [12.489656, 41.8902142];

// Define the easter egg phrases and locations
const EASTER_EGG_PHRASES = {
    tacos: CHICHENITZA,
    croissant: EIFFEL,
    pizza: COLOSSEUM,
    builtbyaliens: GREAT_PYRAMID,
};

const GEOJSON_LAYER_SOURCES = {
    tubeStations: 'https://cdn.jsdelivr.net/gh/pat-mw/farrago-js/data/tubemaps.json'
}
// Get the location data from the displayed elements
const getEventData = () => {
    const eventElements = document.querySelectorAll("#location-data .location");
    const events = [];

    eventElements.forEach((element) => {
        const id = element.getAttribute("data-id");
        const locationUrl = element.getAttribute("data-locationUrl");
        const eventEl = element;
        const name = element.getAttribute("data-name");
        const address = element.getAttribute("data-address");
        const bio = element.getAttribute("data-bio");
        const date = element.getAttribute("data-date");
        const lat = element.getAttribute("data-lat");
        const lng = element.getAttribute("data-lng");

        const linkEl = element.querySelector("[data-link]");

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

// Initialize the map
const initializeMap = () => {
    $(".map-overlay-layer").hide();
    const btnResetMapEl = document.querySelector("[btn-reset-map]");
    const locationsCollectionEl = document.querySelector(
        "[el-locations-collection]"
    );

    const events = getEventData();

    if (events.length === 0) {
        console.error("No events with valid locations found.");
        return;
    } else {
        console.log(`Found ${events.length} events with valid locations.`);
    }

    // initialise from the map bounds
    var eventsBounds = getEventsMapBounds(events);

    const map = new mapboxgl.Map({
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
            markerElement.classList.add("marker");

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

                    // event.eventEl is the element of this event
                    // it is a grandchild of locationsCollectionEl
                    // locationsCollec tionEl is set to overflow-auto
                    // if the selected event is not in view, scroll to it
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

    // add an easter egg that checks user keyboard presses without overriding the default event.
    // when the precise sequence of characters matched by 'EASTER_EGG_PHRASE' (ex: 'pizza') is hit, set the maps location to the EASTER_EGG_LOCATION

    // Initialize an empty string to store the keys pressed by the user
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
                        <div class="tooltip2_image-wrapper">
                            <img
                                src="${event.image}"
                                loading="lazy"
                                data-img=""
                                alt=""
                                class="tooltip2_image"
                            />
                        </div>
                        <h6 data-name="">${event.name}</h6>
                        <div class="margin-top-25 margin-xxsmall">
                            <a
                                data-link=""
                                href="${event.link}"
                                class="button-31 is-tooltip-button w-inline-block"
                            >
                                <div>Learn More</div>
                                <div class="icon-embed-xxsmall-25 w-embed">
                                    <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M6 3L11 8L6 13"
                                            stroke="CurrentColor"
                                            stroke-width="1.5"
                                        ></path>
                                    </svg>
                                </div>
                            </a>
                        </div>
                    </div>
                </div>
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
