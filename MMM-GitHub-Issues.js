Module.register('MMM-GitHub-Issues', {
  defaults: {
    updateInterval: 1000 * 60 * 10,
    maxTitleLength: 100,
    issueCount: 10,
    repoOwner: 'portainer',
    repoName: 'portainer',
    issueState: 'open',
    sort: 'created',
    direction: 'desc',
  },

  getStyles: function () {
    return [
      this.file('MMM-GitHub-Issues.css'),
      'font-awesome.css'
    ];
  },

  start: function () {
    Log.log('Starting module: ' + this.name);
    var self = this;
    setTimeout(function() {
      self.updateCycle();
    }, 2000);
    setInterval(function() {
      self.updateCycle();
    }, self.config.updateInterval);
  },

  updateCycle: async function () {
    this.ghData = [];
    await this.updateData();
    this.updateDom();
  },

  updateData: async function () {
    const resBase = await fetch(`https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}`)
    if (resBase.ok) {
      const jsonBase = await resBase.json();
      const repoData = {
        title: `${this.config.repoOwner}/${this.config.repoName}`,
      }
      const issuesConfig = {
        state: this.state || 'open',
        sort: this.sort || 'created',
        direction: this.direction || 'desc',
      }
      let params = [];
      Object.keys(issuesConfig).forEach(key => {
        if (issuesConfig[key]) {
          params.push(`${key}=${issuesConfig[key]}`)
        }
      });
      const resIssues = await fetch(`https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}/issues?${params.join('&')}`)
      if (resIssues.ok) {
        let jsonIssues = await resIssues.json();
        for (var i = jsonIssues.length - 1; i >= 0; i--) {
          if (jsonIssues[i].hasOwnProperty('pull_request')) {
            jsonIssues.splice(i, 1);
          }
        }
        if (this.config.maxTitleLength) {
          jsonIssues.forEach(issue => {
            if (issue.title.length > this.config.maxTitleLength) {
              issue.title = issue.title.substr(0, this.config.maxTitleLength) + '...';
            }
          })
        }
        repoData.issues = jsonIssues;
      }
      this.ghData.push(repoData);
    }
  },

  getHeader: function () {
    return this.data.header + `: ${this.config.repoOwner}/${this.config.repoName}`;
  },

  getDom: function () {
    let table = document.createElement('table');
    table.classList.add('gh-issues');

    if (this.ghData) {
      var issue = [];
      for (var i = 0; i < this.config.issueCount; i++) {
          issue = this.ghData[0].issues[i];
          const issueRow = document.createElement('tr');
          const issueEntry = document.createElement('td');
          issueEntry.style.paddingLeft = '1em';
          issueEntry.colSpan = 2;
          issueEntry.innerText = `#${issue.number} ${issue.title}`;
          issueRow.append(issueEntry);
          const issueCommments = document.createElement('td');
          issueCommments.style.paddingRight = '1em';
          issueCommments.colspan = 1;
          issueCommments.innerHTML = `${issue.comments} <i class="far fa-comment-alt"></i>`;
          issueRow.append(issueCommments);          
          table.append(issueRow);
      }
    }

    return table;
  }
});