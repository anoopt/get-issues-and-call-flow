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
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            // Set the context
            const context = github.context;
            // Get the GitHub token
            const githubToken = core.getInput('githubToken');
            // get octokit client
            const octokit = new github.GitHub(githubToken);
            // Set the repo url
            const repoUrl = `https://github.com/${github.context.repo}`;
            // Variable to hold the issues that are required
            let requiredIssues = [];
            // Label on which issues need to be filtered e.g. bug, question etc
            const filterLabel = core.getInput('filterLabel');
            // State of the issue that need to be filtered
            const filterState = core.getInput('filterState');
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
            core.setOutput("requiredIssues", JSON.stringify(requiredIssues));
        }
        catch (error) {
            core.setFailed(error.message);
        }
    });
}
run();
