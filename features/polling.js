class Polling {
  constructor(roomId) {
    this.roomId = roomId;
    this.polls = new Map();
    this.setupUI();
  }

  setupUI() {
    this.container = document.createElement('div');
    this.container.className = 'polling-container';
    this.container.innerHTML = `
      <div class="polls-list"></div>
      <div class="poll-create">
        <button id="createPollBtn">Create Poll</button>
      </div>
    `;
    document.body.appendChild(this.container);
    this.bindEvents();
  }

  createPoll(question, options) {
    const poll = {
      id: Date.now().toString(),
      question,
      options: options.map(text => ({ text, votes: [] })),
      createdBy: window.username,
      createdAt: Date.now(),
      active: true
    };

    this.polls.set(poll.id, poll);
    this.broadcastPoll(poll);
    this.renderPoll(poll);
    return poll;
  }

  vote(pollId, optionIndex) {
    const poll = this.polls.get(pollId);
    if (!poll || !poll.active) return;

    // Remove previous vote
    poll.options.forEach(opt => {
      opt.votes = opt.votes.filter(v => v.user !== window.username);
    });

    // Add new vote
    poll.options[optionIndex].votes.push({
      user: window.username,
      timestamp: Date.now()
    });

    this.broadcastPoll(poll);
    this.renderPoll(poll);
  }

  renderPoll(poll) {
    const totalVotes = poll.options.reduce(
      (sum, opt) => sum + opt.votes.length, 0
    );

    const pollEl = document.createElement('div');
    pollEl.className = 'poll';
    pollEl.innerHTML = `
      <div class="poll-question">${poll.question}</div>
      <div class="poll-options">
        ${poll.options.map((opt, i) => {
          const percentage = totalVotes ? 
            (opt.votes.length / totalVotes * 100).toFixed(1) : 0;
          return `
            <div class="poll-option" data-poll-id="${poll.id}" data-option="${i}">
              <div class="option-text">${opt.text}</div>
              <div class="option-bar" style="width: ${percentage}%"></div>
              <div class="option-stats">
                ${opt.votes.length} votes (${percentage}%)
              </div>
              <div class="option-voters">
                ${opt.votes.map(v => v.user).join(', ')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
      <div class="poll-meta">
        Created by ${poll.createdBy}
        ${!poll.active ? '(Closed)' : ''}
      </div>
    `;

    // Replace existing poll or add new
    const existing = document.querySelector(`[data-poll-id="${poll.id}"]`);
    if (existing) {
      existing.replaceWith(pollEl);
    } else {
      this.container.querySelector('.polls-list').appendChild(pollEl);
    }
  }

  closePoll(pollId) {
    const poll = this.polls.get(pollId);
    if (poll && poll.createdBy === window.username) {
      poll.active = false;
      this.broadcastPoll(poll);
      this.renderPoll(poll);
    }
  }

  broadcastPoll(poll) {
    window.port.postMessage({
      type: 'poll_update',
      data: poll
    });
  }

  handlePollUpdate(poll) {
    this.polls.set(poll.id, poll);
    this.renderPoll(poll);
  }

  bindEvents() {
    this.container.addEventListener('click', e => {
      const option = e.target.closest('.poll-option');
      if (option) {
        const pollId = option.dataset.pollId;
        const optionIndex = parseInt(option.dataset.option);
        this.vote(pollId, optionIndex);
      }
    });

    document.getElementById('createPollBtn').onclick = () => {
      this.showCreatePollForm();
    };
  }

  showCreatePollForm() {
    const form = document.createElement('div');
    form.className = 'poll-form';
    form.innerHTML = `
      <input type="text" id="pollQuestion" placeholder="Poll question">
      <div id="pollOptions">
        <input type="text" placeholder="Option 1">
        <input type="text" placeholder="Option 2">
      </div>
      <button id="addOption">Add Option</button>
      <button id="submitPoll">Create Poll</button>
    `;

    form.querySelector('#addOption').onclick = () => {
      const optionsContainer = form.querySelector('#pollOptions');
      const newOption = document.createElement('input');
      newOption.type = 'text';
      newOption.placeholder = `Option ${optionsContainer.children.length + 1}`;
      optionsContainer.appendChild(newOption);
    };

    form.querySelector('#submitPoll').onclick = () => {
      const question = form.querySelector('#pollQuestion').value;
      const options = Array.from(form.querySelectorAll('#pollOptions input'))
        .map(input => input.value.trim())
        .filter(Boolean);

      if (question && options.length >= 2) {
        this.createPoll(question, options);
        form.remove();
      }
    };

    this.container.appendChild(form);
  }
}