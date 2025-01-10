import { Bridge, BridgeMessageOfType, BridgeMessagePayloadOfType, BridgeMessageType, validateBridgeMessageType } from '../index.js'

const connectionFieldSetEl = document.createElement('fieldset')
document.body.append(connectionFieldSetEl)
const connectionLegendEl = document.createElement('legend')
connectionLegendEl.textContent = 'Connection'
connectionFieldSetEl.append(connectionLegendEl)

const connectBtnEl = document.createElement('button')
connectBtnEl.textContent = 'Connect'
connectBtnEl.addEventListener('click', () => {
    bridge.connect()   
})
connectionFieldSetEl.append(connectBtnEl)

const eventLogEl = document.createElement('pre')
connectionFieldSetEl.append(eventLogEl)

const bridge = new Bridge()
bridge.on('connected', () => {
    connectBtnEl.textContent = 'Connected'
    connectBtnEl.disabled = true
    writeToEventLog('Connected')
    
})
bridge.on('connecting', () => {
    connectBtnEl.textContent = 'Connecting'
    connectBtnEl.disabled = true
    writeToEventLog('Connecting')
})
bridge.on('disconnected', reconnecting => {
    if (!reconnecting) {
        connectBtnEl.textContent = 'Connect'
        connectBtnEl.disabled = false
    }
    writeToEventLog('Disconnected')
})
bridge.on('message', async msg => {
    writeToEventLog(JSON.stringify(msg))
})

const currentMessagePanels: MessagePanel[] = []

makeMessagePanel('CameraQuery', () => {
    makeMessageButton('CameraQuery', 'CameraResponse', () => ({ }), async (response) => {})
})
makeMessagePanel('MoveCameraCommand', () => {
    const inputMoveCameraX = makeNumberInput('x', 0)
    const inputMoveCameraY = makeNumberInput('y', 0)
    const inputMoveCameraZoom = makeNumberInput('zoom', 8)
    makeMessageButton('MoveCameraCommand', 'MoveCameraResult', () => ({ x: inputMoveCameraX.getValue(), y: inputMoveCameraY.getValue(), zoom: inputMoveCameraZoom.getValue() }), async (result) => {})
})
makeMessagePanel('AgentListQuery', () => {
    const inputAgentListIncludeActive = makeBooleanInput('includeActive', true)
    const inputAgentListIncludeReserve = makeBooleanInput('includeReserve', true)
    makeMessageButton('AgentListQuery', 'AgentListResponse', () => ({ includeActive: inputAgentListIncludeActive.getValue(), includeReserve: inputAgentListIncludeReserve.getValue() }), async (response) => {})
})
makeMessagePanel('AgentDetailsQuery', () => {
    const inputAgentDetailsAgentID = makeNumberInput('agentID', 0)
    makeMessageButton('AgentDetailsQuery', 'AgentDetailsResponse', () => ({ agentID: inputAgentDetailsAgentID.getValue() }), async (response) => {})
})
makeMessagePanel('DepartmentListQuery', () => {
    makeMessageButton('DepartmentListQuery', 'DepartmentListResponse', () => ({ }), async (response) => {})
})
makeMessagePanel('ManageProgressQuery', () => {
    makeMessageButton('ManageProgressQuery', 'ManageProgressResponse', () => ({ }), async (response) => {})
})
makeMessagePanel('StartManagingCommand', () => {
    makeMessageButton('StartManagingCommand', 'StartManagingResult', () => ({ }), async (result) => {})
})

function writeToEventLog(msg: string) {
    eventLogEl.append(document.createTextNode(msg))
    eventLogEl.append(document.createElement('br'))
}

interface MessagePanel {
    panelEl: HTMLFieldSetElement
    legendEl: HTMLLegendElement
    outputEl: HTMLPreElement
}

function getActiveMessagePanel(): MessagePanel {
    return currentMessagePanels[currentMessagePanels.length - 1]
}

function makeInput(label: string, type: string) {
    const labelEl = document.createElement('label')
    labelEl.textContent = label
    const inputEl = document.createElement('input')
    inputEl.type = type
    labelEl.append(inputEl)
    getActiveMessagePanel().panelEl.append(labelEl)
    return { labelEl, inputEl }
}

function makeStringInput(label: string, defaultValue: string) {
    const { labelEl, inputEl } = makeInput(label, 'text')
    inputEl.value = defaultValue

    const getValue = () => inputEl.value
    const setValue = (value: string) => inputEl.value = value

    return { inputEl, labelEl, getValue, setValue }
}

function makeNumberInput(label: string, defaultValue: number) {
    const { labelEl, inputEl } = makeInput(label, 'number')
    inputEl.valueAsNumber = defaultValue

    const getValue = () => inputEl.valueAsNumber
    const setValue = (value: number) => inputEl.valueAsNumber = value

    return { inputEl, labelEl, getValue, setValue }
}

function makeBooleanInput(label: string, defaultValue: boolean) {
    const { labelEl, inputEl } = makeInput(label, 'checkbox')
    inputEl.type = 'checkbox'

    const getValue = () => inputEl.checked
    const setValue = (value: boolean) => inputEl.checked = value

    return { inputEl, labelEl, getValue, setValue }
}

function makeMessageButton<T extends BridgeMessageType, U extends BridgeMessageType>(msgType: T, responseType: U, getPayload: () => BridgeMessagePayloadOfType<T>, handleResponse: (msg: BridgeMessageOfType<U>) => Promise<void>) {
    const messagePanel = getActiveMessagePanel()
    const buttonEl = document.createElement('button')
    buttonEl.textContent = msgType
    buttonEl.addEventListener('click', async () => {
        buttonEl.disabled = true
        try {
            const response = await bridge.sendAndWaitForReply(msgType, getPayload())
            messagePanel.outputEl.textContent = JSON.stringify(response, undefined, 2)
            validateBridgeMessageType(response, responseType)
            await handleResponse(response)
        } catch (err) {
            messagePanel.outputEl.textContent = String(err)
        }
        buttonEl.disabled = false
    })
    messagePanel.panelEl.append(buttonEl)
    bridge.on('connected', () => {
        buttonEl.disabled = false
    })
    bridge.on('disconnected', () => {
        buttonEl.disabled = true
    })
    return { buttonEl }
}

function makeMessagePanel(msgType: BridgeMessageType, makeBody: () => void) {
    const panelEl = document.createElement('fieldset')
    const legendEl = document.createElement('legend')
    legendEl.textContent = msgType
    const outputEl = document.createElement('pre')
    const panel: MessagePanel = { panelEl, legendEl, outputEl }
    currentMessagePanels.push(panel)
    panelEl.append(legendEl)
    makeBody()
    panelEl.append(outputEl)
    currentMessagePanels.pop()
    if (currentMessagePanels.length) getActiveMessagePanel().panelEl.append(panelEl)
    else document.body.append(panelEl)
    return panel
}
