game = angular.module 'SMSGame', ['ngRoute','firebase','ngSanitize','textAngular']

game.run [
  '$firebaseSimpleLogin'
  '$firebase'
  '$rootScope'
  '$location'
  ($firebaseSimpleLogin,$firebase,$rootScope,$location) ->

    firebaseRef = new Firebase 'http://dwp-game.firebaseio.com'

    $rootScope.loggedIn = false

    $rootScope.auth = $firebaseSimpleLogin firebaseRef

    $rootScope.$on '$firebaseSimpleLogin:error', (event, error) ->
      console.log event, error

    $rootScope.$on '$firebaseSimpleLogin:login', (event, user) ->

      $rootScope.loggedIn = true

      userRef = new Firebase 'http://dwp-game.firebaseio.com/users/'+user.uid
      $rootScope.user = $firebase userRef
        .$asObject()

      $rootScope.user.$loaded().then (data) ->

        $rootScope.user.uid = user.uid
        $rootScope.user.name = user.username
        $rootScope.user.provider = user.provider
        $rootScope.user.profess = $rootScope.user.project = $rootScope.user.class = 100


        $rootScope.user.$save()

        if $location.path() is '/admin' and not $rootScope.user.admin
          $location.path '/'




      if $location.path() is '/'
        $location.path '/game'



    $rootScope.$on '$firebaseSimpleLogin:logout', (event) ->

      $rootScope.loggedIn = false

      console.log 'logged out'


    $rootScope.$on '$routeChangeStart', (e,next) ->

      if next.access is 'private' and $rootScope.loggedIn is false

          $location.path '/'
      else if $rootScope.loggedIn
        $rootScope.user.$loaded().then (data) ->

          if next.access is 'admin' and not $rootScope.user.admin
            $location.path '/'

]

game.directive "compileHtml", ($compile) ->
  restrict: "A"
  replace: true
  link: (scope, element, attrs) ->
    scope.$watch attrs.compileHtml, (value) ->
      element.html value
      $compile(element.contents()) scope

game.filter "toArray", ->
  "use strict"
  (obj) ->
    return obj  unless obj instanceof Object
    Object.keys(obj).filter((key) ->
      key  if key.charAt(0) isnt "$"
    ).map (key) ->
      Object.defineProperty obj[key], "$key",
        __proto__: null
        value: key


game.filter "getPoints", ->
  "use strict"
  (array,type) ->
    points = 0
    if array and array.missions
      angular.forEach array.missions, (value) ->
        points += value.points if value.status is 1 and type is 'pending'
        points += value.awarded if value.status is 2 and type is 'complete'
        if type is 'selected' and value.status is 0
          points += value.points

    points


game.filter "int", ->
  "use strict"
  (value) ->
   parseInt value




