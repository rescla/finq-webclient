/**
 * Created by c.kramer on 9/2/2014.
 */
'use strict';

describe('Unit: StoryRun service', function() {

    var storyRunService,
        moduleService,
        feedbackService,
        environmentMock,
        FEEDBACK,
        MODULES,
        backend;

    beforeEach(function() {
        module('finqApp');
        module('finqApp.service');
    });
    beforeEach(inject(function ($httpBackend, storyRun, feedback, _FEEDBACK_, module, _MODULES_, environment, environmentServiceMock) {
        backend = $httpBackend;
        storyRunService = storyRun;
        feedbackService = feedback;
        moduleService = module;
        FEEDBACK = _FEEDBACK_;
        MODULES = _MODULES_;
        environmentMock = environmentServiceMock.environments;
        backend.expectGET('/environments').respond(200, environmentMock);
        environment.list();
    }));

    it('should render a succcess message after the successful running of a single story', function () {
        backend.expectPOST('/run/stories').respond(200, {id: 1});
        var feedbackSpy = sinon.spy(feedbackService, 'success');
        storyRunService.runStory({story: 1,scenarios: [1]}, environmentMock[0].id);
        backend.flush();
        feedbackSpy.should.have.been.calledWith(FEEDBACK.SUCCESS.RUN.SINGLE_REQUEST, {environment: environmentMock[0].name});
    });

    it('should render a success message after the succesful running of multiple stories', function () {
        backend.expectPOST('/run/stories').respond(200, {id: 1});
        var feedbackSpy = sinon.spy(feedbackService, 'success');
        storyRunService.runStories([
            {story: 1,scenarios: [1]},
            {story: 2,scenarios: [2]}
        ], environmentMock[0].id);
        backend.flush();
        feedbackSpy.should.have.been.calledWith(FEEDBACK.SUCCESS.RUN.MULTIPLE_REQUEST,{count: 2, environment: environmentMock[0].name});
    });

    it('should respond to a failed attempt to run a story by showing the user feedback', function () {
        backend.expectPOST('/run/stories').respond(503, 'fail to run as expected');
        var feedbackSpy = sinon.spy(feedbackService, 'error');
        storyRunService.runStory({story: 1,scenarios: [1]}, 1);
        backend.flush();
        feedbackSpy.should.have.been.calledWith(FEEDBACK.ERROR.RUN.REQUEST_FAILED);
    });

    it('should respond to a failed attempt to run multiple stories by showing the user feedback', function () {
        backend.expectPOST('/run/stories').respond(503, 'fail to run as expected');
        var feedbackErrorSpy = sinon.spy(feedbackService, 'error');
        storyRunService.runStories([
            {story: 1,scenarios: [1]},
            {story: 2,scenarios: [2]}
        ], 1);
        backend.flush();
        feedbackErrorSpy.should.have.been.calledWith(FEEDBACK.ERROR.RUN.REQUEST_FAILED);
    });

    it('should not attempt to run an empty story set, but instead show an alert', function () {
        var feedbackSpy = sinon.spy(feedbackService, 'alert');
        storyRunService.runStories([]);
        feedbackSpy.should.have.been.calledWith(FEEDBACK.ALERT.RUN.NO_STORIES_SELECTED);
    });

    it('should update the module and section badges after a successfull story run start', function () {
        var sectionBadgeSpy = sinon.spy(moduleService, 'updateSectionBadge');
        var moduleBadgeSpy = sinon.spy(moduleService, 'updateModuleBadge');
        backend.expectPOST('/run/stories').respond(200, {id: 1});
        storyRunService.runStories([
            {story: 1,scenarios: [1]},
            {story: 2,scenarios: [2]}
        ], 1);
        backend.flush();
        sectionBadgeSpy.should.have.been.calledWith(MODULES.RUNNER.sections.RUNNING,['run-1'],true);
        moduleBadgeSpy.should.have.been.calledWith(MODULES.RUNNER,['run-1'],true);
    });

});