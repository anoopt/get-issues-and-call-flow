"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const fetch = __importStar(require("node-fetch"));
function run() {
    return __awaiter(this, void 0, void 0, function* () {
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
            console.log(repoUrl);
            // GitHub URL which shows the filtered issues
            const filteredIssuesUrl = `${repoUrl}/issues?q=is:issue is:${filterState} label:${filterLabel}`;
            // Subject of the message that will be posted in Teams
            const subject = `List of issues labelled as ${filterLabel} that are open`;
            // Variable to to hold the object to send to Flow
            let issuesObjToSend = {};
            // Variable to hold the issues that are required
            let requiredIssues = [];
            // Build the options to get the required issues
            const opts = octokit.issues.listForRepo.endpoint.merge(Object.assign(Object.assign({}, context.issue), { state: filterState, labels: filterLabel }));
            // Get the issues based on options
            const issues = yield octokit.paginate(opts);
            // Build the requiredIssues object 
            for (const issue of issues) {
                requiredIssues.push({
                    title: issue.title,
                    body: issue.body.substring(0, 100) + "...",
                    url: issue.html_url,
                    assignedTo: issue.assignee.login,
                    assignedToPic: issue.assignee.avatar_url
                });
            }
            console.log(requiredIssues);
            // Create the notification text that the user will see in their mobile
            const notificationText = `There are ${requiredIssues.length} issues marked as ${filterLabel} that are ${filterState} this week.`;
            // Build the object to send to the Flow
            issuesObjToSend = { githubUrl: filteredIssuesUrl, issues: requiredIssues, subject: subject, notificationText: notificationText };
            // Call the Flow
            yield fetch(flowUrl, {
                method: 'POST',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(issuesObjToSend)
            });
            console.log("Data sent to Flow");
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
