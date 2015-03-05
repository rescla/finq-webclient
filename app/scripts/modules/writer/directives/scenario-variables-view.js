/**
 * Created by marc.fokkert on 4-3-2015.
 */
angular.module('finqApp.writer.directive')
    .directive('scenarioVariablesView', function () {
        return {
            scope: {
                //scenarios: '='
            },
            restrict: 'A',
            templateUrl: 'views/modules/writer/directives/scenario-variables-view.html',
            controller: 'ScenarioVariablesViewCtrl',
            link: function (scope) {


            },
            controllerAs: 'scenarioVariablesView'
        }
    })
    .controller('ScenarioVariablesViewCtrl', function ($scope, selectedItem) {
        var that = this;

        $scope.test = "bar";
        $scope.scenarioVariablesView = {
            variableTypes: []
        };

        $scope.$watch(function () {
                return selectedItem.getSelectedItemId();
            }
            , function (item) {
                Update(item);
            });

        function Update(item) {
            var variableTypes = [];
            if (item !== null) {
                // TODO Fill scenario input values
                variableTypes.push({
                    title: 'Scenario attribute values',
                    addable: false,
                    variables: [
                        {
                            name: '$customerid',
                            value: '#customerid',
                            linked: true
                        }
                    ]
                });

                if (item.indexOf('step') !== -1) {
                    // selected item is a step
                    // TODO fill step input and output values
                    variableTypes.push({
                            title: 'Step input values',
                            addable: false,
                            variables: [
                                {
                                    name: 'amount',
                                    value: 'undefined',
                                    linked: false
                                }
                            ]
                        }
                    );
                    variableTypes.push({
                            title: 'Step output values',
                            addable: false,
                            variables: [
                                {
                                    name: 'amount',
                                    linked: false
                                }
                            ]
                        }
                    )

                }
                // TODO Fill scenario output values
                variableTypes.push({
                    title: 'Scenario output values',
                    addable: true,
                    variables: [
                        {
                            name: 'foo',
                            value: 'bar',
                            linked: false
                        }
                    ]
                });
            }


            $scope.scenarioVariablesView.variableTypes = variableTypes;
        }


    });