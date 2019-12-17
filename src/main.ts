import * as core from '@actions/core';
import * as github from '@actions/github';
import * as fetch from 'node-fetch';

async function run() {
    try {

        // Set the context
        const context = github.context;

        // Get the GitHub token
        const githubToken = core.getInput('githubToken');

        // URL of the HTTP triggered Flow 
        const flowUrl = core.getInput('flowUrl');

        // Label on which issues need to be filtered e.g. bug, question etc
        const filterLabel = core.getInput('filterLabel');

        // State of the issue that need to be filtered
        const filterState = core.getInput('filterState');

        // get octokit client
        const octokit = new github.GitHub(githubToken);

        // Set the repo Url
        const repoUrl = `https://github.com/${github.context.repo.repo}`;

        // GitHub URL which shows the filtered issues
        const filteredIssuesUrl = `${repoUrl}/issues?q=is:issue is:${filterState} label:${filterLabel}`;

        // Subject of the message that will be posted in Teams
        const subject = `List of issues labelled as ${filterLabel} that are open`;

        // Variable to to hold the object to send to Flow
        let issuesObjToSend = {};

        // Variable to hold the issues that are required
        let requiredIssues = [];

        // Build the options to get the required issues
        const opts = octokit.issues.listForRepo.endpoint.merge({
            ...context.issue,
            state: filterState,
            labels: filterLabel
        })

        // Get the issues based on options
        const issues = await octokit.paginate(opts)

        // Build the requiredIssues object 
        for (const issue of issues) {
            requiredIssues.push({
                title: issue.title,
                body: issue.body.substring(0, 100) + "...",
                url: issue.html_url,
                assignedTo: issue.assignee.login,
                assignedToPic: issue.assignee.avatar_url
            })
        }

        console.log(requiredIssues);

        // Create the notification text that the user will see in their mobile
        const notificationText = `There are ${requiredIssues.length} issues marked as ${filterLabel} that are ${filterState} this week.`

        // Build the object to send to the Flow
        issuesObjToSend = { githubUrl: filteredIssuesUrl, issues: requiredIssues, subject: subject, notificationText: notificationText }

        // Call the Flow
        await fetch(flowUrl, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(issuesObjToSend)
        })

        console.log("Data sent to Flow");

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();