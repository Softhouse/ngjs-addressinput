'use strict';

/**
 * Based on https://github.com/wpalahnuk/ngAutocomplete/blob/master/src/ngAutocomplete.js
 * A directive for adding google places autocomplete to a text box
 * google places autocomplete info: https://developers.google.com/maps/documentation/javascript/places
 *
 * Usage:
 *
 * <input type="text"  address-input ng-model="someString" options="options" details="details/>
 *
 * + ng-model - autocomplete textbox value
 *
 * + details - more detailed autocomplete result, includes address parts, latlng, etc. (Optional)
 *
 * + options - configuration for the autocomplete (Optional)
 *
 *       + types: type,        a String list, values can be 'geocode', 'establishment', '(regions)', or '(cities)'
 *       + bounds: bounds,     Google maps LatLngBounds Object, biases results to bounds, but may return results outside these bounds
 *       + country: country    String, ISO 3166-1 Alpha-2 compatible country code. examples; 'ca', 'us', 'gb'
 *       + watchEnter:         Boolean, true; on Enter select top autocomplete result. false(default); enter ends autocomplete
 *       + validateDetails     Function, a function to validate the details object
 *       + onValidDetails      Function for calling when details are valid, given the validateDetails function
 *       + convertDetails      Function, Converts the details object for you (NOTE: this is NOT done before the validate function)
 *
 * example:
 *
 *    options = {
 *        types: '(cities)',
 *        country: 'ca'
 *    }
**/

(function() {

  angular
    .module('ngjsAddressinput')
    .directive('addressInput', AddressInput);


    function AddressInput() {
      return {
        require: ['ngModel', 'addressInput'],
        scope: {
          ngModel: '=',
          details: '=?',
          options: '=?',
        },
        link: link,
        controller: Controller,
        controllerAs: 'vm',
        bindToController: true
      }

      function Controller($scope) {
        const vm = $scope.vm;
        vm.createOptions = createOptions;

        function createOptions(specifiedOpts) {
          const options = specifiedOpts || {};
          options.watchEnter = specifiedOpts.watchEnter || true;
          options.types = specifiedOpts.types || [];
          options.bounds = specifiedOpts.bounds;
          options.componentRestrictions = specifiedOpts.country ? { country: specifiedOpts.country } : undefined;
          options.validateDetails = options.validateDetails || (() => true);
          options.onValidDetails = options.onValidDetails || (() => undefined);
          options.convertDetails = options.convertDetails || (details => details);
          return options;
        }

      }

      function link(scope, element, attrs, controllers) {
        const [ngModel, vm] = controllers;
        vm.options = vm.createOptions(vm.options);
        const gPlace = new google.maps.places.Autocomplete(element[0], vm.options);
        const autocompleteService = new google.maps.places.AutocompleteService();
        const placeService = new google.maps.places.PlacesService(element[0]);
        ngModel.$render = function () {
          const location = ngModel.$viewValue;
          element.val(location);
        };

        /*
        * User input/place changed
        */
        google.maps.event.addListener(gPlace, 'place_changed', () => onPlaceChanged(gPlace));

        // Select first address on focusout
        element.on('focusout', function() {
          getPlace({ name: ngModel.$viewValue }, vm.options);
        });

        // Select first address on enter in input
        element.on('keydown', function(e) {
          if (e.keyCode == 13) {
            google.maps.event.trigger(input, 'keydown', { keyCode: 40 });
            google.maps.event.trigger(input, 'keydown', { keyCode: 13 });
          }
        });

        /*
        * Update the current place
        */
        function onPlaceChanged(gPlace) {
          const result = gPlace.getPlace();
          if(!!result && !!result.address_components) return applyDetails(result);
          if(vm.options.watchEnter) return getPlace(result);
        }

        /*
        * Manually call to retrieve place and details for a { name: 'SomeString' } object
        * This is usefull when the user ends the input without selecting a value
        */
        function getPlace(result, options) {
          if(!result || !result.name.length) {
            return;
          }

          options = options || {};
          options.input = result.name;
          options.offset = result.name.length;

          return autocompleteService.getPlacePredictions(options, onAutocompleteResult);
        }

        /*
        * To be called upon retrieveing autocomplete result from google
        */
        function onAutocompleteResult(list, status) {
          if(!list || !list.length) {
            return applyDetails({});
          }

          placeService.getDetails({'reference': list[0].reference}, onDetailsResult);
        }

        /*
        * To be called upon retrieveing address details result from google
        */
        function onDetailsResult(result, status) {
          if (status !== google.maps.GeocoderStatus.OK) {
            return undefined;
          }

          applyDetails(result);
        }

        /*
        * Apply the details result.
        */
        function applyDetails(details) {
          const isValid = vm.options.validateDetails(details);
          if(isValid) {
            scope.$apply(() => {
              ngModel.$setViewValue(details.formatted_address);
              element.val(details.formatted_address);
              vm.details = vm.options.convertDetails(angular.copy(details), angular.copy(vm.details));
              vm.options.onValidDetails(vm.details);
              ngModel.$setValidity('invalidAddress', true);
            });
          } else {
            scope.$apply(() => {
              if(details.formatted_address) {
                ngModel.$setViewValue(details.formatted_address);
                element.val(details.formatted_address);
              }

              ngModel.$setValidity('invalidAddress', false);
            });
          }

        }

      }
    }

})();
