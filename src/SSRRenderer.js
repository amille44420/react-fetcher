export default class SSRRenderer {
  constructor(initialState = []) {
    // list of promises to wait for
    this.promises = [];

    // persisted data through multiple run for SSR
    this.state = initialState;

    // current index
    this.index = 0;

    // has the state been consumed
    this.consumed = false;
  }

  hasPromises() {
    return this.promises.length > 0;
  }

  hasState(index) {
    return !this.consumed && index + 1 <= this.state.length;
  }

  register() {
    const { index } = this;
    this.index += 1;

    return index;
  }

  getState(index) {
    const state = this.state[index];

    if (index + 1 === this.state.length) {
      this.consumed = true;
    }

    return state;
  }

  attachPromise(promise, props, index) {
    this.promises.push(
      promise.then(result => {
        // register everything for this promise
        this.state[index] = { result, props };

        // and return the result again
        return result;
      }),
    );
  }

  consume() {
    // get promises to wait for
    const { promises } = this;

    // reset the renderer
    this.index = 0;
    this.promises = [];
    this.consumed = false;

    return Promise.all(promises);
  }
}
