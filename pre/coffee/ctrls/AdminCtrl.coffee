game.controller 'AdminCtrl', [
  '$scope',
  '$firebase'
  '$rootScope'
  '$log'
  ($scope,$firebase,$rootScope,$log) ->

    $scope.$log = $log;

    $scope.pendingFilter =
      pending: true

    $scope.completeFilter = {}


    activityRef = new Firebase 'http://dwp-game.firebaseio.com/activity/'
    $scope.activity = $firebase activityRef
      .$asArray()


    skillsRef = new Firebase 'http://dwp-game.firebaseio.com/skills/'
    $scope.skills = $firebase skillsRef
      .$asArray()

    $scope.selectedArea = 0

    userRef = new Firebase 'http://dwp-game.firebaseio.com/users/'
    $scope.users = $firebase userRef
    .$asArray()

    $scope.clearActivity = ->
      activityRef = new Firebase 'http://dwp-game.firebaseio.com/activity/'
      activity = $firebase activityRef
      activity.$remove()

    $scope.archiveStudent = ->
      archiveRef = new Firebase 'http://dwp-game.firebaseio.com/archive/'
      archive = $firebase archiveRef
      .$asArray()
      user = $scope.users[$scope.archiveUser]
      archive.$add user
      $scope.users.$remove user


    $scope.createNewSkill = ->
      $scope.skills.$add angular.copy($scope.newSkill)
      $scope.newSkill = {}


    $scope.createNewLevel = ->

      levelRef = skillsRef.child($scope.newLevelSkill).child('levels')
      levels = $firebase levelRef
      .$asArray()

      levels.$add angular.copy($scope.newLevel)
      $scope.newLevel = {}


    $scope.createNewMission = ->

      missionRef = skillsRef.child($scope.newMissionSkill).child('levels').child($scope.newMissionLevel).child('missions')
      missions = $firebase missionRef
      .$asArray()

      missions.$add angular.copy($scope.newMission)
      $scope.newMission = {}
    ]