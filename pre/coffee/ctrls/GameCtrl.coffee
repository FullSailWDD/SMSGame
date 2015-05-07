game.controller 'GameCtrl', [
  '$scope',
  '$firebase'
  '$rootScope'
  ($scope,$firebase,$rootScope) ->

    # status
    # 0 = selected
    # 1 = pending
    # 2 = complete

    $scope.orderBy = '-status'

    userSkillsRef = ''


    skillsRef = new Firebase 'http://dwp-game.firebaseio.com/skills/'
    $scope.skills = $firebase skillsRef
      .$asArray()

    activityRef = new Firebase 'http://dwp-game.firebaseio.com/activity/'
    activity = $firebase activityRef
      .$asArray()

    $scope.selectedArea = 0

    $scope.total = 0
    $scope.max = 0

    $scope.points = [
        value: 0
        class: 'danger'
      ,
        value: 25
        class: 'warning'
      ,
        value: 50
        class: 'info'
      ,
        value: 75
        class: 'primary'
      ,
        value: 100
        class: 'success'
    ]




    $scope.getDeg = (value, max) ->
      val = 360
      val = 360/ 100 * (value / max * 100) unless 360/ 100 * (value / max * 100) > 360
      return val

    $scope.getWeek = (max, complete) ->
      week = max/4
      weekNum = 1 + parseInt complete / week



    $scope.isLocked = (level_points,completed_points)->

      return false unless level_points and completed_points

      return level_points > completed_points

    $scope.selectMission = (mission, level_id, level_title,skill) ->

      activity.$add
        user: $rootScope.user.name
        msg: 'Selected Mission '+mission.title
      newMission = angular.copy mission
      newMission.level_id = level_id
      newMission.level_title = level_title
      newMission.status = 0
      skillMissionsRef = userSkillsRef.child(skill).child('missions')
      skillMissions = $firebase skillMissionsRef
        .$asArray()

      skillMissions.$add newMission


    $scope.removeMission = (index,skill) ->

      skillMissionsRef = userSkillsRef.child(skill).child('missions')
      skillMissions = $firebase skillMissionsRef
        .$asArray()

      skillMissions.$loaded().then ->

        skillMissions.$remove index


    $scope.markPending = (id, skill) ->



      missionRef = userSkillsRef.child(skill).child('missions').child(id)
      mission = $firebase missionRef
        .$asObject()

      mission.$loaded().then ->
        mission.status = 1
        mission.$save()

        activity.$add
          user: $rootScope.user.name
          msg: 'Marked mission '+ mission.title + ' as pending'

    $scope.addComment = (mission_id,skill_id,comment,$event) ->
      missionRef = userSkillsRef.child(skill_id).child('missions').child(mission_id)
      commentRef = missionRef.child('comments')
      mission = $firebase missionRef
        .$asObject()
      missionComments = $firebase commentRef
        .$asArray()

      missionComments.$add {text:comment,user:$rootScope.user.name}
      mission.$loaded().then ->
        activity.$add
          user: $rootScope.user.name
          msg: 'Added comment '+comment + ' to mission ' + mission.title

      $event.preventDefault()
      $event.stopPropagation()

    $scope.awardPoints = (percent, skill_id, mission_id, points) ->

      missionRef = userSkillsRef.child(skill_id).child('missions').child(mission_id)
      mission = $firebase missionRef
      .$asObject()

      mission.$loaded().then ->
        mission.status = 2
        mission.awarded = parseInt(points * percent / 100)
        mission.$save()



    userRef = new Firebase 'http://dwp-game.firebaseio.com/users/'
    $scope.users = $firebase userRef
    .$asArray()

    $scope.$watch 'selectedUser', (value) ->
      return unless value
      userSkillsRef = new Firebase 'http://dwp-game.firebaseio.com/users/'+value+'/skills'
      $scope.userSkills = $firebase userSkillsRef
        .$asObject()

      $scope.userSkills.$loaded().then ->
        angular.forEach $scope.userSkills, (skill, skill_id) ->
          angular.forEach skill.missions, (mission, mission_id) ->
            missionRef = userSkillsRef.child(skill_id).child('missions').child(mission_id)
            mission_obj = $firebase missionRef
            .$asObject()
            mission_obj.$loaded().then ->
              return if mission_obj.status
              if mission_obj.complete
                mission_obj.status = 2
              else if mission_obj.pending
                mission_obj.status = 1
              else
                mission_obj.status = 0
              mission_obj.$save()

    $rootScope.auth.$getCurrentUser().then (user) ->
      return unless user
      $scope.selectedUser = user.uid













]