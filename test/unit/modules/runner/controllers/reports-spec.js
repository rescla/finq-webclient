/**
 * Created by c.kramer on 9/2/2014.
 */
'use strict';

describe('Unit: ReportsCtrl', function() {

    var ReportsCtrl,
        configProvider,
        reportMockData,
        moduleSpy,
        MODULES,
        EVENTS,
        STATE,
        $timeout,
        scope;

    beforeEach(function() {
        module('finqApp');
        module('finqApp.service');
        module('finqApp.mock');
    });
    beforeEach(inject(function ($controller, $rootScope, $httpBackend, config, _module_, _STATE_, _MODULES_, _EVENTS_, _$timeout_, reportServiceMock, report, story, storyServiceMock) {
        scope = $rootScope.$new();
        MODULES = _MODULES_;
        EVENTS = _EVENTS_;
        STATE = _STATE_;
        $timeout = _$timeout_;
        configProvider = config;
        reportMockData = reportServiceMock;
        moduleSpy = sinon.spy(_module_, 'setCurrentSection');
        $httpBackend.expectGET('/scripts/config.json').respond(200, {
            address: '',
            selectDropdown: {pagination: {itemsPerPage: 4}},
            report: {pagination: {
                server: {reportsPerRequest: 2, maxTotalReports: 2},
                client: {reportsPerPage: 2}
            }}
        });
        $httpBackend.expectGET('/app').respond(200);
        $httpBackend.expectGET('/books').respond(200, storyServiceMock.books);
        $httpBackend.expectGET('/runs?status='+STATE.RUN.SCENARIO.SUCCESS+'&status='+STATE.RUN.SCENARIO.FAILED+'&size=2&page=0').respond(200, reportMockData);
        config.load().then(function() {
            story.list().then(function() {
                report.list().then(function() {
                    ReportsCtrl = $controller('ReportsCtrl', {$scope: scope});
                });
            });
        });
        $httpBackend.flush();
    }));
    afterEach(function() {
        scope.$emit('$destroy');
    });

    it('should initially not have any item selected', function () {
        expect(ReportsCtrl.selectedItem).to.be.null;
    });

    it('should initially set the maximum selectable items for a dropdown to the standard configured value', function () {
        expect(ReportsCtrl.maxSelectItems).to.equal(configProvider.client().selectDropdown.pagination.itemsPerPage);
    });

    it('should register itself as the active module and section', function () {
        expect(moduleSpy).to.have.been.calledWith(MODULES.RUNNER.sections.REPORTS);
    });

    it('should respond to an update status request by setting the status keys', function () {
        var statusEventData = {id: 'status', keys: [STATE.RUN.SCENARIO.SUCCESS], keysFull: [STATE.RUN.SCENARIO.SUCCESS]};
        scope.$emit(EVENTS.SCOPE.FILTER_SELECT_UPDATED,statusEventData);
        expect(ReportsCtrl.filter.status.ids).to.deep.equal(statusEventData.keys);
    });

    it('should initially have an empty list of reports', function () {
        expect(scope.reportList().length).to.equal(0);
    });

});
