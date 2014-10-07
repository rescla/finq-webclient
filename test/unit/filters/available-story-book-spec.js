/**
 * Created by c.kramer on 9/6/2014.
 */
'use strict';

describe('Unit: Available Storybook Filter execution', function() {

    var availableStorybookFilter,
        storybooks;

    beforeEach(function() {
        module('finqApp');
        module('finqApp.filter');
        module('finqApp.mock');
        inject(function($injector){
            availableStorybookFilter = $injector.get('$filter')('availableStorybookFilter');
        });
    });
    beforeEach(inject(function (storyServiceMock,$httpBackend,config,storybookSearch) {
        storybooks = storyServiceMock.books;
        $httpBackend.expectGET('/scripts/config.json').respond(200, {
            address: '',
            maxSearchResults: 1000
        });
        $httpBackend.expectGET('/app/info').respond(200);
        config.load().then(function() {
            storybookSearch.initialize(storybooks);
        });
        $httpBackend.flush();
    }));

    it('should return all storybooks in case of a clean filter combination', function () {
        var filteredBooks = availableStorybookFilter(storybooks,'',[],[],0,10);
        expect(filteredBooks.length).to.equal(2);
    });

    it('should return a limited set of story books in case the set filter applies', function () {
        var filteredBooks = availableStorybookFilter(storybooks,'',[storybooks[0].stories[0].sets[0]],[],0,10);
        expect(filteredBooks.length).to.equal(1);
    });

    it('should return a limited set of story books in case the tag filter applies', function () {
        var filteredBooks = availableStorybookFilter(storybooks,'',[],['additional'],0,10);
        expect(filteredBooks.length).to.equal(1);
    });

    it('should return a limited set of story books in case the search query filter applies', function () {
        var filteredBooks = availableStorybookFilter(storybooks,'additional',[],[],0,10);
        expect(filteredBooks.length).to.equal(1);
    });

});
