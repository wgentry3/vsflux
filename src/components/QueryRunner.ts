import * as vscode from 'vscode'

import { Store } from './Store'
import { IInstance } from '../types'
import { TableView } from '../views/TableView'
import { QueryResult } from '../models'
import { APIClient } from './APIClient'

/* Take a flux query, execute it against the currently active Instance, and show the results. */
export async function runQuery(query : string, instance : IInstance, context : vscode.ExtensionContext) : Promise<void> {
    try {
        const queryApi = new APIClient(instance).getQueryApi()
        const results = await QueryResult.run(queryApi, query)
        const tableView = new TableView(context)
        tableView.show(results, instance.name)
    } catch (error) {
        let errorMessage = 'Error executing query'
        if (error instanceof Error) {
            errorMessage = error.message
        }
        vscode.window.showErrorMessage(errorMessage)
        console.error(error)
    }
}
