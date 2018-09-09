import React, { Component } from 'react';
import './App.css';
import Button from './Button';
import axios from 'axios';
import { sortBy } from 'lodash';
import classNames from 'classnames';
const largeColumn = {
  width: '40%',
};
const midColumn = {
  width: '30%',
};
const smallColumn = {
  width: '10%',
};
const SORTS = {
  NONE: list => list,
  TITLE: list => sortBy(list, 'title'),
  AUTHOR: list => sortBy(list, 'author'),
  COMMENTS: list => sortBy(list, 'num_comments').reverse(),
  POINTS: list => sortBy(list, 'points').reverse(),
}
const DEFAULT_QUERY = 'redux';
const DEFAULT_HPP = '100';
const PATH_BASE = 'http://hn.algolia.com/api/v1';
const PATH_SEARCH = '/search';
const PARAM_SEARCH = 'query=';
const PARAM_PAGE = 'page=';
const PARAM_HPP = 'hitsPerPage=';
const withLoading = (Component) => ({ isLoading, ...rest }) =>
  isLoading
    ? <Loading />
    : <Component {...rest} />
const Loading = () =>
  <div><i className="fas fa-spinner fa-spin"></i>Loading...</div>
const ButtonWithLoading = withLoading(Button);
const Search = ({ value, onChange, onSubmit, children }) => {
  let input;
  return (
    <form>
      <input
        ref={(node) => input = node}
        type="text"
        value={value}
        onChange={onChange}
      />
      <button type="submit" onClick={onSubmit}>{children}</button>
    </form>)
}
const Table = ({ list, onDismiss, sortKey, onSort,isSortReverse }) =>{
  const sortedList=SORTS[sortKey](list);
  const reverseSortedList=isSortReverse?sortedList.reverse():sortedList;
  return (
  <div className="table">
    <div className="table-header">
      <span style={{ width: '40%' }}>
        <Sort
          sortKey={'TITLE'}
          onSort={onSort}
          activeSortKey={sortKey}
        >Title</Sort>
      </span>
      <span style={{ width: '30%' }}>
        <Sort
          sortKey={'AUTHOR'}
          onSort={onSort}
          activeSortKey={sortKey}
        > Author</Sort>
      </span>
      <span style={{ width: '10%' }}>
        <Sort
          sortKey={'COMMENTS'}
          onSort={onSort}
          activeSortKey={sortKey}
        >Comments</Sort>
      </span>
      <span style={{ width: '10%' }}>
        <Sort
          sortKey={'POINTS'}
          onSort={onSort}
          activeSortKey={sortKey}
        >Points</Sort>
      </span>
      <span style={{ width: '10%' }}>
        Archive
</span>
    </div>
    
    {reverseSortedList.map(item =>
      <div key={item.objectID} className="table-row">
        <span style={largeColumn}>
          <a href={item.url}>{item.title}</a>
        </span>
        <span style={midColumn}>{item.author}</span>
        <span style={smallColumn}>{item.num_comments}</span>
        <span style={smallColumn}>{item.points}</span>
        <span style={smallColumn}>
          <Button className="button-inline" onClick={() => onDismiss(item.objectID)}>Dismiss</Button>

        </span>
      </div>
    )}
  </div>
  )
  }
const Sort = ({ sortKey, onSort, children,activeSortKey }) =>{
  const sortClass=classNames('button-inline',{'button-active': sortKey === activeSortKey});
  return (
<Button
onClick={() => onSort(sortKey)}
className={sortClass}
>
{children}
  </Button>)}
class App extends Component {
  _isMounted = false;
  onDIsmiss(id) {
    const { searchKey, results } = this.state;
    const { hits, page } = results[searchKey];
    const isNotId = item => item.objectID !== id;
    const updateHits = hits.filter(isNotId);
    this.setState({
      results: { ...results, [searchKey]: { hits: updateHits, page } }
    })
  }
  onSearchChange(event) {
    this.setState({
      searchTerm: event.target.value
    })
  }
  constructor(props) {
    super(props);
    this.state = {
      results: null,
      searchKey: '',
      searchTerm: DEFAULT_QUERY,
      error: null,
      isLoading: false,
      sortKey: 'NONE',
      isSortReverse: false,


    };
    this.needsToSearchTopStories = this.needsToSearchTopStories.bind(this);
    this.setSearchTopStories = this.setSearchTopStories.bind(this);
    this.fetchSearchTopStories = this.fetchSearchTopStories.bind(this);
    this.onDIsmiss = this.onDIsmiss.bind(this);
    this.onSearchChange = this.onSearchChange.bind(this);
    this.onSearchSubmit = this.onSearchSubmit.bind(this);
    this.onSort = this.onSort.bind(this);
  }
  onSort(sortKey) {
    const isSortReverse = this.state.sortKey === sortKey && !this.state.isSortReverse;
this.setState({ sortKey, isSortReverse });
  }
  needsToSearchTopStories(searchTerm) {
    return !this.state.results[searchTerm];
  }
  fetchSearchTopStories(searchTerm, page = 0) {
    this.setState({ isLoading: true })
    console.log(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`);
    axios(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
      .then(result => this._isMounted && this.setSearchTopStories(result.data))
      .catch(error => this._isMounted && this.setState({ error }))
    // fetch(`${PATH_BASE}${PATH_SEARCH}?${PARAM_SEARCH}${searchTerm}&${PARAM_PAGE}${page}&${PARAM_HPP}${DEFAULT_HPP}`)
    //   .then(response => response.json())
    //   .then(results => {
    //     this.setSearchTopStories(results);
    //   })
    //   .catch(error => this.setState({error}))
  }
  setSearchTopStories(result) {
    const { hits, page } = result;
    const { searchKey, results } = this.state;
    const oldHits = results && results[searchKey] ? results[searchKey].hits : [];
    const updatedHits = [...oldHits, ...hits];
    this.setState({
      results: { ...results, [searchKey]: { hits: updatedHits, page } },
      isLoading: false
    })
  }
  onSearchSubmit(event) {

    const { searchTerm } = this.state;
    this.setState({
      searchKey: searchTerm
    })
    if (this.needsToSearchTopStories(searchTerm)) {
      this.fetchSearchTopStories(searchTerm);
    }
    event.preventDefault();
  }
  componentDidMount() {
    this._isMounted = true;
    const { searchTerm } = this.state;
    this.setState({
      searchKey: searchTerm
    })
    this.fetchSearchTopStories(searchTerm);
  }
  componentWillMount = () => {
    this._isMounted = false;
  }

  render() {
    const { searchTerm, results, searchKey, error, isLoading, sortKey,isSortReverse } = this.state;
    const page = (
      results &&
      results[searchKey] &&
      results[searchKey].page
    ) || 0;
    const list = (
      results && results[searchKey] &&
      results[searchKey].hits
    ) || [];
    return (
      <div className="page">
        <div className="interactions">
          <Search value={searchTerm} onChange={this.onSearchChange} onSubmit={this.onSearchSubmit}>Search</Search>
          {
            error ? <div className="interactions">
              <p>Something went wrong.</p>
            </div>
              : <Table isSortReverse={isSortReverse} sortKey={sortKey} onSort={this.onSort} list={list} onDismiss={this.onDIsmiss} />
          }
        </div>
        <div className="interactions">
          <ButtonWithLoading isLoading={isLoading} onClick={() => this.fetchSearchTopStories(searchTerm, page + 1)}>More</ButtonWithLoading>
        </div>
      </div>
    );
  }
}

export default App;
