'use strict';

(function(){

  angular.module('ngjsAddressinput')
    .directive('addressValidator', addressValidator);

  function addressValidator($q, $timeout) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function (scope, element, attr, ngModel) {
        const setValidity = function (isValid) {
          ngModel.$setValidity('invalidAddress', isValid);

          if (isValid && attr.onValidAddress) {
            const callback = scope[attr.onValidAddress.slice(0, -2)];
            if (callback && callback instanceof Function) return callback();
          }
        };

        scope.$watch(attr.addressValidator, function (address, oldValue) {
          
        }, true);
      }
    };
  }

  function addressChanged(adress) {
    // empty should be ok. directive should be used with required
    // TODO: This is a bit dangerous if the value is undefined because it wasn't set on the "auto-fill-watch"
    if (!address) return setValidity(true); 
    if (!address.address_components) return setValidity(false);

    const details = parseDetails(address.address_components);

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
    return validatedAddress.street ||
      validatedAddress.streetnumber ||
      validatedAddress.postalcode ||
      validatedAddress.city;
  }

})();

