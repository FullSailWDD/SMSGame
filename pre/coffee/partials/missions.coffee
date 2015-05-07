game.directive 'mission', () ->
  restrict: 'A'
  templateUrl: 'views/_mission.html'
  transclude: true
  scope:
    mission: '='
    selected: '='
