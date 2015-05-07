var game;

game = angular.module('SMSGame', ['ngRoute', 'firebase', 'ngSanitize', 'textAngular']);

game.run([
  '$firebaseSimpleLogin', '$firebase', '$rootScope', '$location', function($firebaseSimpleLogin, $firebase, $rootScope, $location) {
    var firebaseRef;
    firebaseRef = new Firebase('http://dwp-game.firebaseio.com');
    $rootScope.loggedIn = false;
    $rootScope.auth = $firebaseSimpleLogin(firebaseRef);
    $rootScope.$on('$firebaseSimpleLogin:error', function(event, error) {
      return console.log(event, error);
    });
    $rootScope.$on('$firebaseSimpleLogin:login', function(event, user) {
      var userRef;
      $rootScope.loggedIn = true;
      userRef = new Firebase('http://dwp-game.firebaseio.com/users/' + user.uid);
      $rootScope.user = $firebase(userRef).$asObject();
      $rootScope.user.$loaded().then(function(data) {
        $rootScope.user.uid = user.uid;
        $rootScope.user.name = user.username;
        $rootScope.user.provider = user.provider;
        $rootScope.user.profess = $rootScope.user.project = $rootScope.user["class"] = 100;
        $rootScope.user.$save();
        if ($location.path() === '/admin' && !$rootScope.user.admin) {
          return $location.path('/');
        }
      });
      if ($location.path() === '/') {
        return $location.path('/game');
      }
    });
    $rootScope.$on('$firebaseSimpleLogin:logout', function(event) {
      $rootScope.loggedIn = false;
      return console.log('logged out');
    });
    return $rootScope.$on('$routeChangeStart', function(e, next) {
      if (next.access === 'private' && $rootScope.loggedIn === false) {
        return $location.path('/');
      } else if ($rootScope.loggedIn) {
        return $rootScope.user.$loaded().then(function(data) {
          if (next.access === 'admin' && !$rootScope.user.admin) {
            return $location.path('/');
          }
        });
      }
    });
  }
]);

game.directive("compileHtml", function($compile) {
  return {
    restrict: "A",
    replace: true,
    link: function(scope, element, attrs) {
      return scope.$watch(attrs.compileHtml, function(value) {
        element.html(value);
        return $compile(element.contents())(scope);
      });
    }
  };
});

game.filter("toArray", function() {
  "use strict";
  return function(obj) {
    if (!(obj instanceof Object)) {
      return obj;
    }
    return Object.keys(obj).filter(function(key) {
      if (key.charAt(0) !== "$") {
        return key;
      }
    }).map(function(key) {
      return Object.defineProperty(obj[key], "$key", {
        __proto__: null,
        value: key
      });
    });
  };
});

game.filter("getPoints", function() {
  "use strict";
  return function(array, type) {
    var points;
    points = 0;
    if (array && array.missions) {
      angular.forEach(array.missions, function(value) {
        if (value.status === 1 && type === 'pending') {
          points += value.points;
        }
        if (value.status === 2 && type === 'complete') {
          points += value.awarded;
        }
        if (type === 'selected' && value.status === 0) {
          return points += value.points;
        }
      });
    }
    return points;
  };
});

game.filter("int", function() {
  "use strict";
  return function(value) {
    return parseInt(value);
  };
});

game.config([
  '$routeProvider', function($routeProvider) {
    return $routeProvider.when('/', {
      templateUrl: 'views/home.html',
      access: 'public'
    }).when('/game', {
      controller: 'GameCtrl',
      templateUrl: 'views/game.html',
      access: 'private'
    }).when('/admin', {
      controller: 'AdminCtrl',
      templateUrl: 'views/admin.html',
      access: 'admin'
    });
  }
]);

game.controller('AdminCtrl', [
  '$scope', '$firebase', '$rootScope', '$log', function($scope, $firebase, $rootScope, $log) {
    var activityRef, skillsRef, userRef;
    $scope.$log = $log;
    $scope.pendingFilter = {
      pending: true
    };
    $scope.completeFilter = {};
    activityRef = new Firebase('http://dwp-game.firebaseio.com/activity/');
    $scope.activity = $firebase(activityRef).$asArray();
    skillsRef = new Firebase('http://dwp-game.firebaseio.com/skills/');
    $scope.skills = $firebase(skillsRef).$asArray();
    $scope.selectedArea = 0;
    userRef = new Firebase('http://dwp-game.firebaseio.com/users/');
    $scope.users = $firebase(userRef).$asArray();
    $scope.clearActivity = function() {
      var activity;
      activityRef = new Firebase('http://dwp-game.firebaseio.com/activity/');
      activity = $firebase(activityRef);
      return activity.$remove();
    };
    $scope.archiveStudent = function() {
      var archive, archiveRef, user;
      archiveRef = new Firebase('http://dwp-game.firebaseio.com/archive/');
      archive = $firebase(archiveRef).$asArray();
      user = $scope.users[$scope.archiveUser];
      archive.$add(user);
      return $scope.users.$remove(user);
    };
    $scope.createNewSkill = function() {
      $scope.skills.$add(angular.copy($scope.newSkill));
      return $scope.newSkill = {};
    };
    $scope.createNewLevel = function() {
      var levelRef, levels;
      levelRef = skillsRef.child($scope.newLevelSkill).child('levels');
      levels = $firebase(levelRef).$asArray();
      levels.$add(angular.copy($scope.newLevel));
      return $scope.newLevel = {};
    };
    return $scope.createNewMission = function() {
      var missionRef, missions;
      missionRef = skillsRef.child($scope.newMissionSkill).child('levels').child($scope.newMissionLevel).child('missions');
      missions = $firebase(missionRef).$asArray();
      missions.$add(angular.copy($scope.newMission));
      return $scope.newMission = {};
    };
  }
]);

game.controller('GameCtrl', [
  '$scope', '$firebase', '$rootScope', function($scope, $firebase, $rootScope) {
    var activity, activityRef, skillsRef, userRef, userSkillsRef;
    $scope.orderBy = '-status';
    userSkillsRef = '';
    skillsRef = new Firebase('http://dwp-game.firebaseio.com/skills/');
    $scope.skills = $firebase(skillsRef).$asArray();
    activityRef = new Firebase('http://dwp-game.firebaseio.com/activity/');
    activity = $firebase(activityRef).$asArray();
    $scope.selectedArea = 0;
    $scope.total = 0;
    $scope.max = 0;
    $scope.points = [
      {
        value: 0,
        "class": 'danger'
      }, {
        value: 25,
        "class": 'warning'
      }, {
        value: 50,
        "class": 'info'
      }, {
        value: 75,
        "class": 'primary'
      }, {
        value: 100,
        "class": 'success'
      }
    ];
    $scope.getDeg = function(value, max) {
      var val;
      val = 360;
      if (!(360 / 100 * (value / max * 100) > 360)) {
        val = 360 / 100 * (value / max * 100);
      }
      return val;
    };
    $scope.getWeek = function(max, complete) {
      var week, weekNum;
      week = max / 4;
      return weekNum = 1 + parseInt(complete / week);
    };
    $scope.isLocked = function(level_points, completed_points) {
      if (!(level_points && completed_points)) {
        return false;
      }
      return level_points > completed_points;
    };
    $scope.selectMission = function(mission, level_id, level_title, skill) {
      var newMission, skillMissions, skillMissionsRef;
      activity.$add({
        user: $rootScope.user.name,
        msg: 'Selected Mission ' + mission.title
      });
      newMission = angular.copy(mission);
      newMission.level_id = level_id;
      newMission.level_title = level_title;
      newMission.status = 0;
      skillMissionsRef = userSkillsRef.child(skill).child('missions');
      skillMissions = $firebase(skillMissionsRef).$asArray();
      return skillMissions.$add(newMission);
    };
    $scope.removeMission = function(index, skill) {
      var skillMissions, skillMissionsRef;
      skillMissionsRef = userSkillsRef.child(skill).child('missions');
      skillMissions = $firebase(skillMissionsRef).$asArray();
      return skillMissions.$loaded().then(function() {
        return skillMissions.$remove(index);
      });
    };
    $scope.markPending = function(id, skill) {
      var mission, missionRef;
      missionRef = userSkillsRef.child(skill).child('missions').child(id);
      mission = $firebase(missionRef).$asObject();
      return mission.$loaded().then(function() {
        mission.status = 1;
        mission.$save();
        return activity.$add({
          user: $rootScope.user.name,
          msg: 'Marked mission ' + mission.title + ' as pending'
        });
      });
    };
    $scope.addComment = function(mission_id, skill_id, comment, $event) {
      var commentRef, mission, missionComments, missionRef;
      missionRef = userSkillsRef.child(skill_id).child('missions').child(mission_id);
      commentRef = missionRef.child('comments');
      mission = $firebase(missionRef).$asObject();
      missionComments = $firebase(commentRef).$asArray();
      missionComments.$add({
        text: comment,
        user: $rootScope.user.name
      });
      mission.$loaded().then(function() {
        return activity.$add({
          user: $rootScope.user.name,
          msg: 'Added comment ' + comment + ' to mission ' + mission.title
        });
      });
      $event.preventDefault();
      return $event.stopPropagation();
    };
    $scope.awardPoints = function(percent, skill_id, mission_id, points) {
      var mission, missionRef;
      missionRef = userSkillsRef.child(skill_id).child('missions').child(mission_id);
      mission = $firebase(missionRef).$asObject();
      return mission.$loaded().then(function() {
        mission.status = 2;
        mission.awarded = parseInt(points * percent / 100);
        return mission.$save();
      });
    };
    userRef = new Firebase('http://dwp-game.firebaseio.com/users/');
    $scope.users = $firebase(userRef).$asArray();
    $scope.$watch('selectedUser', function(value) {
      if (!value) {
        return;
      }
      userSkillsRef = new Firebase('http://dwp-game.firebaseio.com/users/' + value + '/skills');
      $scope.userSkills = $firebase(userSkillsRef).$asObject();
      return $scope.userSkills.$loaded().then(function() {
        return angular.forEach($scope.userSkills, function(skill, skill_id) {
          return angular.forEach(skill.missions, function(mission, mission_id) {
            var missionRef, mission_obj;
            missionRef = userSkillsRef.child(skill_id).child('missions').child(mission_id);
            mission_obj = $firebase(missionRef).$asObject();
            return mission_obj.$loaded().then(function() {
              if (mission_obj.status) {
                return;
              }
              if (mission_obj.complete) {
                mission_obj.status = 2;
              } else if (mission_obj.pending) {
                mission_obj.status = 1;
              } else {
                mission_obj.status = 0;
              }
              return mission_obj.$save();
            });
          });
        });
      });
    });
    return $rootScope.auth.$getCurrentUser().then(function(user) {
      if (!user) {
        return;
      }
      return $scope.selectedUser = user.uid;
    });
  }
]);

game.controller('UserCtrl', ['$scope', '$firebaseSimpleLogin', function($scope) {}]);

game.directive('mission', function() {
  return {
    restrict: 'A',
    templateUrl: 'views/_mission.html',
    transclude: true,
    scope: {
      mission: '=',
      selected: '='
    }
  };
});
