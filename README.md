# ngjs-addressinput
Address input directive, with autocomplete and validation, for angularjs, based on google places autocomplete.

NOTE: This module is heavily based on the [ng-autocomplete](https://github.com/wpalahnuk/ngAutocomplete) package.

### Installation
1. Setup a google places api key and add to your project.
2. Install the package

    ````
    npm i ngjs-addressinput --save 
    ````

3. Include the library file

    ````
    node_modules/ngjs-addressinput/dist/ngjs-addressinput.js  
    ````
4. Include the library module
    
    ````
    angular.module('app',[..., ngjsAddressInput])
    ````
### Usage
The module is simple to use but has some options

    ````
  <input type="text"
    class="form-control"
    details="vm.details"
    address-input
    options="vm.options"
    ng-model="vm.model">
  <div>
  
    <label class="input-error-message" ng-show="vm.showError">{{ vm.errorMsg }}</label>
  </div>
    ````

* **details**: The ref pointing to where to store the details fetched by the places search.
* **options**: The options object for the directive; see below.
* **ng-model**: the address to autocomplete


#### Options

The options object contains callback hooks and bounds for limiting and acting on the search events. Ex:


        const SW = new google.maps.LatLng(59.263762, 17.886814);
        const NE = new google.maps.LatLng(59.23078, 18.15088);
        
        vm.options = {
          country: 'se',
          bounds: new google.maps.LatLngBounds(SW, NE),
          types: ['address'],
          validateDetails: isValidDetails,
          convertDetails: getLocation,
          onValidDetails: vm.onValidDetails
        }


* **country**: The country param for the google places api.
* **bounds**: The latlng bounds of the search.
* **types**: The types of the returned results
* **validateDetails**: A function for validation the details returned by the places search. The function only takes one param; the new details object/list.
* **convertDetails** A function for converting the details once validated. The function takes two params; the old details and the new ones.
* **onValidDetails** Event function to be called if the returned details are considered valid by the validateDetails function.