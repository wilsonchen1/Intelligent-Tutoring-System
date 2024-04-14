
#!/usr/bin/env python
# -*- coding: gbk -*-

"""
@Date:    20240226
@Description:  请求eb4
"""

import sys
import requests
import json
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed

# def format_prompt(prompt, encoding="utf-8"):
#     """
#     提示词，可以现在chatgpt或者文心一言中尝试不同提示词
#     """
#     context = u"题目：【%s】" % (prompt.decode(encoding, "ignore"))
#     context = context.encode(encoding, "ignore")
#     return context
def format_prompt(prompt, encoding="utf-8"):
    if isinstance(prompt, bytes):
        prompt = prompt.decode(encoding)  # 将 bytes 解码为 str
    context = "知识点：【{}】".format(prompt)
    return context


def simple_request(prompt, model="aigc/text/wenxinTurbo"):
    """
    prompt: 客户业务描述
    model: 巧匠中支持的模型, 参考文档:https://ku.baidu-int.com/knowledge/HFVrC7hq1Q/MUyZ7Y-BGz/VA_1DZ0wnN/5c5eba8a6dd348
    从测试结果来看,api一次请求只能处理一条input
    """
    headers = {'Content-Type': 'application/json', \
                'userName': 'FCGT001', \
                'password': 'aUxeRvpqku1IEBZn', \
                'reqid': 'aix123'}
    url_format_api = "http://qiaojiang.baidu-int.com/" + model
    url_format_payload = {"modelReq": []}

    tmp_data = {"prompt": format_prompt(prompt), \
                "temperature": 0.9, \
                "maxTokens": 3000, \
                "system": u"你是一个计算机专业的高校教师，掌握丰富的计算机系统基础这门课程的知识\
                    你负责计算机系统基础教材习题的编写。你将看到一些知识点\
                    请根据以下要求生成试卷题目：\
                    - 产生10道填空题目。\
    - 产生试卷的正确答案。\
    - 产生答案的的正确解析。\
    - 确保答案是固定的，可以直接用于比较学生的答案，以便于批改。\
    - 所有题目和解析都应遵循一个清晰、统一的格式。\
    - 直接输出题目、答案、解析三份本身，不要有任何前后缀或多余的字词。\
\
    以此模式完成所有题目。"}
    url_format_payload["modelReq"].append(tmp_data)

    retry_times = 10
    while retry_times > 0:
        r = requests.post(url_format_api, data = json.dumps(url_format_payload), headers = headers)
        if r.status_code == 200:
            res_data = r.json()
            #print >> sys.stderr, json.dumps(r.json())
            if "data" in res_data and "modelRes" in res_data["data"]:
                return res_data["data"]["modelRes"]
            else:
                # print >> sys.stderr, sys.stderr, json.dumps(r.json())
                print(json.dumps(r.json()), file=sys.stderr)


        else:
            print >> sys.stderr, r.status_code
        retry_times -= 1

    return []

# def batch_process(input_f, output_f, model):
#     """
#     目前是单线程处理，可以尝试下多线程
#     """
#     prompts = []
#     for line in open(input_f):
#         line = line.strip()
#         # ll = line.split('\t')
#         # prompts.append(ll[2].decode("gbk", "ignore").encode("utf8", "ignore"))
#         prompts.append(line)

#     #batch_size = 10

#     out_f = open(output_f, "w")
#     for prompt in prompts:
#         res = simple_request(prompt, model)
#         if res:
#             out_f.write(prompt)
#             out_f.write("\t")
#             out_f.write(json.dumps(res, ensure_ascii=False))
#             out_f.write("\n")
#     out_f.close()
def request_wrapper(args):
    return simple_request(*args)

def batch_process(input_f, output_f, model, max_workers=3):
    prompts = []
    with open(input_f, 'r', encoding='utf-8') as fi:
        for line in fi:
            line = line.strip()
            prompts.append(line)

    results = []
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        future_to_prompt = {executor.submit(request_wrapper, (prompt, model)): prompt for prompt in prompts}
        for future in as_completed(future_to_prompt):
            prompt = future_to_prompt[future]
            try:
                result = future.result()
                results.append((prompt, result))
            except Exception as exc:
                print(f'{prompt} generated an exception: {exc}')

    with open(output_f, "w", encoding="utf-8") as fo:
        for prompt, result in results:
            if result:
                fo.write(prompt + "\t" + json.dumps(result, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    input_path, output_path = sys.argv[1], sys.argv[2]
    batch_process(input_path, output_path, "aigc/text/wenxinyiyan4")  # input, output, model

# python wenxin_api_cs_answer.py data_input.txt data_output
