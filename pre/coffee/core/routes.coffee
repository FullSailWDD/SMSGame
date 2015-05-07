game.config [
  '$routeProvider'
  ($routeProvider) ->

    $routeProvider
      .when '/',
        templateUrl: 'views/home.html'
        access: 'public'

       .when '/game',
        controller: 'GameCtrl'
        templateUrl: 'views/game.html'
        access: 'private'
      .when '/admin',
        controller: 'AdminCtrl'
        templateUrl: 'views/admin.html'
        access: 'admin'
]