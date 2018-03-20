'use strict';

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

(function () {
  angular.module('ngjsAddressinput', []);
})();
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

(function () {

  angular.module('ngjsAddressinput').directive('addressInput', AddressInput);

  function AddressInput() {
    return {
      require: ['ngModel', 'addressInput'],
      scope: {
        ngModel: '=',
        details: '=?',
        options: '=?'
      },
      link: link,
      controller: Controller,
      controllerAs: 'vm',
      bindToController: true
    };

    function Controller($scope) {
      var vm = $scope.vm;
      vm.createOptions = createOptions;

      function createOptions(specifiedOpts) {
        var options = specifiedOpts || {};
        options.watchEnter = specifiedOpts.watchEnter || true;
        options.types = specifiedOpts.types || [];
        options.bounds = specifiedOpts.bounds;
        options.componentRestrictions = specifiedOpts.country ? { country: specifiedOpts.country } : undefined;
        options.validateDetails = options.validateDetails || function () {
          return true;
        };
        options.onValidDetails = options.onValidDetails || function () {
          return undefined;
        };
        options.convertDetails = options.convertDetails || function (details) {
          return details;
        };
        return options;
      }
    }

    function link(scope, element, attrs, controllers) {
      var _controllers = _slicedToArray(controllers, 2),
          ngModel = _controllers[0],
          vm = _controllers[1];

      vm.options = vm.createOptions(vm.options);
      var gPlace = new google.maps.places.Autocomplete(element[0], vm.options);
      var autocompleteService = new google.maps.places.AutocompleteService();
      var placeService = new google.maps.places.PlacesService(element[0]);
      ngModel.$render = function () {
        var location = ngModel.$viewValue;
        element.val(location);
      };

      /*
      * User input/place changed
      */
      google.maps.event.addListener(gPlace, 'place_changed', function () {
        return onPlaceChanged(gPlace);
      });

      // Select first address on focusout
      element.on('focusout', function () {
        getPlace({ name: ngModel.$viewValue }, vm.options);
      });

      // Select first address on enter in input
      element.on('keydown', function (e) {
        if (e.keyCode == 13) {
          google.maps.event.trigger(input, 'keydown', { keyCode: 40 });
          google.maps.event.trigger(input, 'keydown', { keyCode: 13 });
        }
      });

      /*
      * Update the current place
      */
      function onPlaceChanged(gPlace) {
        var result = gPlace.getPlace();
        if (!!result && !!result.address_components) return applyDetails(result);
        if (vm.options.watchEnter) return getPlace(result);
      }

      /*
      * Manually call to retrieve place and details for a { name: 'SomeString' } object
      * This is usefull when the user ends the input without selecting a value
      */
      function getPlace(result, options) {
        if (!result || !result.name.length) {
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
        if (!list || !list.length) {
          return applyDetails({});
        }

        placeService.getDetails({ 'reference': list[0].reference }, onDetailsResult);
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
        var isValid = vm.options.validateDetails(details);
        if (isValid) {
          scope.$apply(function () {
            ngModel.$setViewValue(details.formatted_address);
            element.val(details.formatted_address);
            vm.details = vm.options.convertDetails(angular.copy(details), angular.copy(vm.details));
            vm.options.onValidDetails(vm.details);
            ngModel.$setValidity('invalidAddress', true);
          });
        } else {
          scope.$apply(function () {
            if (details.formatted_address) {
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

'use strict';

(function () {

  angular.module('ngjsAddressinput').directive('addressValidator', addressValidator);

  function addressValidator($q, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function link(scope, element, attr, ngModel) {
        var setValidity = function setValidity(isValid) {
          ngModel.$setValidity('invalidAddress', isValid);

          if (isValid && attr.onValidAddress) {
            var callback = scope[attr.onValidAddress.slice(0, -2)];
            if (callback && callback instanceof Function) return callback();
          }
        };

        scope.$watch(attr.addressValidator, function (address, oldValue) {}, true);
      }
    };
  }

  function addressChanged(adress) {
    // empty should be ok. directive should be used with required
    // TODO: This is a bit dangerous if the value is undefined because it wasn't set on the "auto-fill-watch"
    if (!address) return setValidity(true);
    if (!address.address_components) return setValidity(false);

    var details = parseDetails(address.address_components);

    if (!validDetails(details)) {
      return setValidity(false);
    }

    return setValidity(true);
  }

  function parseDetails(addressComponents) {
    return addressComponents.reduce(function (details, item) {
      if (item["types"] == "street_number") details.streetnumber = item["short_name"];
      if (item["types"] == "route") details.street = item["short_name"];
      if (item["types"] == "postal_town") details.city = item["short_name"];
      if (item["types"] == "postal_code") details.postalcode = item["short_name"].replace(" ", "");
    }, {});
  }

  function validDetails() {
    return validatedAddress.street || validatedAddress.streetnumber || validatedAddress.postalcode || validatedAddress.city;
  }
})();