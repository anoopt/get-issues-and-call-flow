import * as core from '@actions/core';
import * as github from '@actions/github';
import { Context } from '@actions/github/lib/context';


async function run() {
    try {

        // Set the context
        const context = github.context;

        // Get the GitHub token
        const githubToken = core.getInput('githubToken');

        // get octokit client
        const octokit = new github.GitHub(githubToken);

        // Variable to hold the issues that are required
        let requiredIssues = []

        // Label on which issues need to be filtered e.g. bug, question etc
        const filterLabel = core.getInput('filterLabel');

        // State of the issue that need to be filtered
        const filterState = core.getInput('filterState');

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

        core.setOutput("requiredIssues", JSON.stringify(requiredIssues));

    } catch (error) {
        core.setFailed(error.message);
    }
}

run();