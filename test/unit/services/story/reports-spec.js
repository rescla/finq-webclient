/**
 * Created by c.kramer on 9/2/2014.
 */
'use strict';

describe('Unit: ReportService', function() {

    var reportService,
        firstResponse,
        secondResponse,
        $rootScope,
        reports;

    beforeEach(function() {
        module('finqApp');
        module('finqApp.service');
        module('finqApp.mock');
    });
    beforeEach(inject(function ($httpBackend, _$rootScope_, report, story, reportServiceMock, storyServiceMock, STATE, config) {
        reportService = report;
        $rootScope = _$rootScope_;
        reportServiceMock.pageSize = 1;
        firstResponse = angular.copy(reportServiceMock);
        secondResponse = angular.copy(reportServiceMock);
        firstResponse.data.splice(1,1);
        secondResponse.data.splice(0,1);
        secondResponse.page = 1;
        $httpBackend.expectGET('/scripts/config.json').respond(200, {
            address: '',
            report: {pagination: {server: {reportsPerRequest: 1, maxTotalReports: 2}}}
        });
        $httpBackend.expectGET('/app').respond(200);
        $httpBackend.expectGET('/books').respond(200, storyServiceMock.books);
        $httpBackend.expectGET('/runs?status='+STATE.RUN.SCENARIO.SUCCESS+'&status='+STATE.RUN.SCENARIO.FAILED+'&size=1&page=0').respond(200, firstResponse);
        $httpBackend.expectGET('/runs?status='+STATE.RUN.SCENARIO.SUCCESS+'&status='+STATE.RUN.SCENARIO.FAILED+'&size=1&page=1').respond(200, secondResponse);
        config.load().then(function() {
            story.list().then(reportService.list().then(function(reportData) {
                reports = reportData;
            }));
        });
        $httpBackend.flush();
    }));

    it('should properly load the reports list', function () {
        expect(reports).to.not.be.undefined;
        expect(reports).to.not.be.empty;
        expect(reports).to.deep.equal([
            {
                id: firstResponse.data[0].id,
                status: firstResponse.data[0].status,
                startedBy: firstResponse.data[0].startedBy,
                startedOn: firstResponse.data[0].startedOn,
                completedOn: firstResponse.data[0].completedOn,
                runtime: '00:06',
                environment: firstResponse.data[0].environment
            },
            {
                id: secondResponse.data[0].id,
                status: secondResponse.data[0].status,
                startedBy: secondResponse.data[0].startedBy,
                startedOn: secondResponse.data[0].startedOn,
                completedOn: secondResponse.data[0].completedOn,
                runtime: '00:11',
                environment: secondResponse.data[0].environment
            }
        ]);
    });

    it('should retrieve a loaded report list in case the listing function is called again', function (done) {
        reportService.list().then(function(list) {
            expect(list).to.deep.equal([
                {
                    id: firstResponse.data[0].id,
                    status: firstResponse.data[0].status,
                    startedBy: firstResponse.data[0].startedBy,
                    startedOn: firstResponse.data[0].startedOn,
                    completedOn: firstResponse.data[0].completedOn,
                    runtime: '00:06',
                    environment: firstResponse.data[0].environment
                },
                {
                    id: secondResponse.data[0].id,
                    status: secondResponse.data[0].status,
                    startedBy: secondResponse.data[0].startedBy,
                    startedOn: secondResponse.data[0].startedOn,
                    completedOn: secondResponse.data[0].completedOn,
                    runtime: '00:11',
                    environment: secondResponse.data[0].environment
                }
            ]);
            done();
        });
        $rootScope.$digest();
    });

});