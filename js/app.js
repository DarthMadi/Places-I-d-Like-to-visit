'use strict';

//Define Global Vars
let GOOGLEMAP;
let currentInfoWindow = null; //To keep track of each info window, it must reside in the global scope.
let mapElement = document.getElementById('map');
let fourSquareApiFail = document.getElementById('foursquare-load-fail');

//Make sure the map loaded successfully

// on map load error.
function failedToFetch() {
    alert("Failed to load the map, please try again by refreshing the page.");
}

//Create a Point of Interest POI constructor to create instances of our data.
class POI {
    constructor(name, lat, lng) {
        this.name = name;
        this.lat = lat;
        this.lng = lng;
    }
}

//lat and long coords obtained from https://google-developers.appspot.com/maps/documentation/utils/geocoder/
//Creating instances of the POI constructor
const pachaSharm = new POI("Pacha Sharm El Sheikh", 27.910101, 34.325215);
const stellaDiMare = new POI("Stella Di Mare Spa", 27.904631, 34.329532);
const helnanMarina = new POI("Helnan Marina Sharm", 27.90746, 34.326177);
const naamaBayCasino = new POI("Naama Bay Casino", 27.906926, 34.327405);
const hardRockCafe = new POI("Hard Rock Cafe", 27.909271, 34.323879);

//Gathering all points of interests into an array.
const LOCATIONS = [pachaSharm, stellaDiMare, helnanMarina, naamaBayCasino, hardRockCafe];


//The Map Locations Model
class MapLocations {
    constructor(locationData) {

    /******** START-- Functions to manipulate the markers********/

    	//Populating the Info window.
        let fillInfoWindow = () => {

            if (this.infoWindow.marker != this.marker) {
                this.infoWindow.setContent(`<div class="infowindowcontent location-title">${this.name}</div>
                <div class="infowindowcontent"><span class="location-detail">Address:</span> ${this.address}</div>
                <div class="infowindowcontent"><span class="location-detail">Category:</span> ${this.category}</div>	
        	`);
                this.infoWindow.marker = this.marker;
            }
            //Tracking the status of the current infowindow.
            //Close if it is open.
            if (currentInfoWindow !== null) {
                currentInfoWindow.close();
            }
            //Otherwise set the currentInfoWindow variable to be equal to the current info window
            currentInfoWindow = this.infoWindow;
            currentInfoWindow.open(GOOGLEMAP, this.marker);
        }	

        //Bouncing the marker.
        let bounceMarker = () => {
            this.marker.setAnimation(google.maps.Animation.BOUNCE);

            setTimeout(() => this.marker.setAnimation(null), 1400);
        }

        //Each Location data
        this.name = locationData.name;
        this.lat = locationData.lat;
        this.lng = locationData.lng;
        this.address = "";
        this.category = "";
        this.isVisible = ko.observable(true);

     	//Create marker instances
        this.marker = new google.maps.Marker({
            map: GOOGLEMAP,
            title: locationData.name,
            position: new google.maps.LatLng(locationData.lat, locationData.lng)

        })
        //Create infoWindow instances
        this.infoWindow = new google.maps.InfoWindow();

        //Show the markers on the map and observe any change.
        this.displayMarker = ko.computed(() => {
            if (this.isVisible() === true) {
                this.marker.setMap(GOOGLEMAP);
            } else {
                this.marker.setMap(null);
            }
            return true;
        }, this)

        //Manipulate each marker.
        this.marker.addListener("click", function() {
            fillInfoWindow();
            bounceMarker();
        });

        //Manipulate the markers when a list element is clicked in the unordered list on the left side of page.
        this.bounceOnListItemClick = () => {
            google.maps.event.trigger(this.marker, 'click');
        }

        //Foursquare API data, fetching and dealing with the results.
        let clientID = "M2X11X0XA5T03ZOZF2TZTXHQS4TF1V5ISURAA3CGYJTS4TRT";
        let clientSecret = "WD0GOTL0WI4JODYUSFWVWDY5TWVLFHMII1MUSDOUUFDQ4CD0";
        let fourSquareApiURL = `https://api.foursquare.com/v2/venues/search?ll=${this.lat},${this.lng}&client_id=${clientID}&client_secret=${clientSecret}&v=20160118&query=${this.name}`;
        fetch(fourSquareApiURL).then(res => {
            // console.log(res.json());
            return res.json();
        }).then(result => {
            this.address = result.response.venues[0].location.formattedAddress[0] + ", Sharm El Sheikh, Egypt"
            //If the formatted address that came from the foursquare API call is just the country
            //Manually add the area, the city then the country.
            if (this.address.startsWith("Egypt")) {
                this.address = "Naama Bay, Sharm El Sheikh, Egypt";
            }
            this.category = result.response.venues[0].categories[0].name;
        }).catch(()=>{
        	setTimeout(()=>fourSquareApiFail.className = "showed",3000);
        })

    }
}

//Our App View Model
class ViewModel {
    constructor() {

    	//Construct the map.
        GOOGLEMAP = new google.maps.Map(mapElement, {
            center: {
                lat: 27.909321,
                lng: 34.325272
            },
            zoom: 15
        });

        //Create the locations array that will be observed.
        this.locations = ko.observableArray();

        //Create the search input observable to check for user input.
        this.searchInput = ko.observable(new String());

        //Instantiating new MapLocations and adding them to the locations observable array.
        LOCATIONS.map(LOCATION => this.locations.push(new MapLocations(LOCATION)));

        //Filter the user input and show the required results
        this.filteredResult = ko.computed(() => {
        	//Observing the input element and see if it is empty then show all the markers on the map.
            let searchString = this.searchInput().toLowerCase();
            if (!searchString) {
                this.locations().forEach(location => {
                    location.isVisible(true);
                })
                return this.locations();
            } else {
            	//Else we create a filtered array using the Array.prototype.filter native method
            	//to show the required markers.
                let filteredArray = this.locations().filter(location => {
                    let locationName = location.name.toLowerCase();
                    let userInput = (locationName.search(searchString)>=0);
                    location.isVisible(userInput);
                    return userInput;
                })
                return filteredArray;
            }
        }, this)
    }
}

//Start our application.
function init() {
    ko.applyBindings(new ViewModel())
}